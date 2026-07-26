package main

import (
	"archive/zip"
	"encoding/binary"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// See docs/TheCelesteDesktop/CelesteMapBin_Format.md for the byte layout this reader implements
// and docs/TheCelesteDesktop/CelesteMapBin_Quirks_And_ModPatterns.md for why the classifier looks like it does.

type MapCollectibleCounts struct {
	Red          int `json:"red"`
	Golden       int `json:"golden"`
	WingedGolden int `json:"wingedGolden"`
	Moon         int `json:"moon"`
	Hearts       int `json:"hearts"`
	MiniHearts   int `json:"miniHearts"`
	Silver       int `json:"silver"`
	Speed        int `json:"speed"`
	Rainbow      int `json:"rainbow"`
	Platinum     int `json:"platinum"`
}

type MapCollectiblesResult struct {
	Success bool                             `json:"success"`
	Maps    map[string]*MapCollectibleCounts `json:"maps,omitempty"`
	Failed  map[string]string                `json:"failed,omitempty"`
	Error   string                           `json:"error,omitempty"`
}

// binReader walks a BinaryPacker document. It stops at the end of the root element and
// ignores anything after it, because ~20% of real maps carry trailing bytes there.
type binReader struct {
	data   []byte
	pos    int
	lookup []string
	counts *MapCollectibleCounts
}

func (r *binReader) u8() (byte, error) {
	if r.pos >= len(r.data) {
		return 0, io.ErrUnexpectedEOF
	}
	b := r.data[r.pos]
	r.pos++
	return b, nil
}

func (r *binReader) u16() (int, error) {
	if r.pos+2 > len(r.data) {
		return 0, io.ErrUnexpectedEOF
	}
	v := binary.LittleEndian.Uint16(r.data[r.pos:])
	r.pos += 2
	return int(v), nil
}

func (r *binReader) skip(n int) error {
	if n < 0 || r.pos+n > len(r.data) {
		return io.ErrUnexpectedEOF
	}
	r.pos += n
	return nil
}

// varint is the 7-bit encoded length prefix .NET's BinaryWriter puts in front of every string.
func (r *binReader) varint() (int, error) {
	result, shift := 0, 0
	for {
		b, err := r.u8()
		if err != nil {
			return 0, err
		}
		result |= int(b&0x7F) << shift
		if b&0x80 == 0 {
			return result, nil
		}
		shift += 7
		if shift > 28 {
			return 0, fmt.Errorf("varint too long at offset %d", r.pos)
		}
	}
}

func (r *binReader) str() (string, error) {
	n, err := r.varint()
	if err != nil {
		return "", err
	}
	if r.pos+n > len(r.data) {
		return "", io.ErrUnexpectedEOF
	}
	s := string(r.data[r.pos : r.pos+n])
	r.pos += n
	return s, nil
}

func (r *binReader) lookupAt(idx int) (string, error) {
	if idx < 0 || idx >= len(r.lookup) {
		return "", fmt.Errorf("lookup index %d out of range (%d entries)", idx, len(r.lookup))
	}
	return r.lookup[idx], nil
}

// readHeader consumes the magic string, the package name and the string lookup table.
func (r *binReader) readHeader() error {
	magic, err := r.str()
	if err != nil {
		return err
	}
	if magic != "CELESTE MAP" {
		return fmt.Errorf("not a Celeste map (magic %q)", magic)
	}
	if _, err = r.str(); err != nil { // package name, unused
		return err
	}
	count, err := r.u16()
	if err != nil {
		return err
	}
	r.lookup = make([]string, count)
	for i := range count {
		if r.lookup[i], err = r.str(); err != nil {
			return err
		}
	}
	return nil
}

// readAttributes returns only the two attribute values the classifier needs; everything else is skipped in place.
func (r *binReader) readAttributes(count int) (bool, bool, error) {
	moon, winged := false, false

	for range count {
		keyIdx, err := r.u16()
		if err != nil {
			return false, false, err
		}
		key, err := r.lookupAt(keyIdx)
		if err != nil {
			return false, false, err
		}
		valueType, err := r.u8()
		if err != nil {
			return false, false, err
		}

		boolValue := false
		switch valueType {
		case 0: // bool
			b, readErr := r.u8()
			if readErr != nil {
				return false, false, readErr
			}
			boolValue = b != 0
		case 1: // u8
			err = r.skip(1)
		case 2: // i16
			err = r.skip(2)
		case 3, 4: // i32, f32
			err = r.skip(4)
		case 5: // index into the string lookup table
			err = r.skip(2)
		case 6: // inline string
			var n int
			if n, err = r.varint(); err == nil {
				err = r.skip(n)
			}
		case 7: // run-length encoded string, length in bytes
			var n int
			if n, err = r.u16(); err == nil {
				err = r.skip(n)
			}
		default:
			return false, false, fmt.Errorf("unknown attribute type %d at offset %d", valueType, r.pos)
		}
		if err != nil {
			return false, false, err
		}

		switch key {
		case "moon":
			moon = boolValue
		case "winged":
			winged = boolValue
		}
	}

	return moon, winged, nil
}

// readElement walks one element and its children. container tracks whether we are inside
// an "entities" or "triggers" list, since only entities are collectibles.
func (r *binReader) readElement(container string) error {
	nameIdx, err := r.u16()
	if err != nil {
		return err
	}
	name, err := r.lookupAt(nameIdx)
	if err != nil {
		return err
	}
	attrCount, err := r.u8()
	if err != nil {
		return err
	}
	moon, winged, err := r.readAttributes(int(attrCount))
	if err != nil {
		return err
	}

	if container == "entities" {
		r.count(name, moon, winged)
	}

	childCount, err := r.u16()
	if err != nil {
		return err
	}
	childContainer := container
	if name == "entities" || name == "triggers" {
		childContainer = name
	}
	for range childCount {
		if err := r.readElement(childContainer); err != nil {
			return err
		}
	}
	return nil
}

var (
	suffixDenyPattern = regexp.MustCompile(`(?i)(trigger|controller|gate|door|block|spawner|respawnpoint|toflag|seed|jar|cabin|switch|field|activator)$`)
	fakeDenyPattern   = regexp.MustCompile(`(?i)(troll|fake)`)
	heartPattern      = regexp.MustCompile(`(?i)(crystalheart|heartgem)`)
	goldenPattern     = regexp.MustCompile(`(?i)golden.?berry`)
	berryPattern      = regexp.MustCompile(`(?i)(berry|berries|strawberr)`)
	platinumPattern   = regexp.MustCompile(`(?i)platinum`)
)

// exactDeny holds entities that look collectible by name but are not.
var exactDeny = map[string]bool{
	"vitellary/keyberry":                       true, // a key reskinned as a berry
	"FactoryHelper/MachineHeart":               true, // machinery, not a collectible
	"CommunalHelper/CustomSummitGem":           true, // summit gem, not a crystal heart
	"ScugHelper/SquareGem":                     true,
	"HeliosHelper/SolHeartsideSwitch":          true,
	"IntoTheJungleCodeMod/LanternHeartSpawner": true,
}

// exactHearts holds crystal-heart entities whose names carry no "heart"/"gem" hint.
var exactHearts = map[string]bool{
	"blackGem":            true, // the standard crystal heart
	"birdForsakenCityGem": true, // Forsaken City A-side ships its own entity
	"dreamHeartGem":       true,
}

// count classifies one entity by name and attributes. First match wins.
//
// ponytail: name-pattern heuristic over arbitrary third-party helper entities. It was derived from
// every .bin in a 282-mod install (see the quirks doc), but a new helper can always invent a name
// that slips through. Upgrade path if a specific mod reports wrong numbers: an explicit
// name -> kind override map consulted before these patterns.
func (r *binReader) count(name string, moon bool, winged bool) {
	if fakeDenyPattern.MatchString(name) || suffixDenyPattern.MatchString(name) || exactDeny[name] {
		return
	}

	switch {
	case name == "CollabUtils2/MiniHeart":
		r.counts.MiniHearts++
	case exactHearts[name] || heartPattern.MatchString(name):
		r.counts.Hearts++
	case name == "CollabUtils2/SilverBerry":
		r.counts.Silver++
	case name == "CollabUtils2/SpeedBerry":
		r.counts.Speed++
	case name == "CollabUtils2/RainbowBerry":
		r.counts.Rainbow++
	case platinumPattern.MatchString(name) && berryPattern.MatchString(name):
		r.counts.Platinum++
	case goldenPattern.MatchString(name):
		if winged {
			r.counts.WingedGolden++
		} else {
			r.counts.Golden++
		}
	case berryPattern.MatchString(name):
		if moon {
			r.counts.Moon++
		} else {
			r.counts.Red++ // winged reds count as red, same as vanilla
		}
	}
}

func countCollectiblesInMap(data []byte) (*MapCollectibleCounts, error) {
	r := &binReader{data: data, counts: &MapCollectibleCounts{}}
	if err := r.readHeader(); err != nil {
		return nil, err
	}
	if err := r.readElement(""); err != nil {
		return nil, err
	}
	return r.counts, nil
}

// sidFromMapPath turns "Maps/Crylone/farshore/farshore.bin" into "Crylone/farshore/farshore".
func sidFromMapPath(path string) string {
	normalized := strings.ReplaceAll(path, "\\", "/")
	normalized = strings.TrimSuffix(normalized, filepath.Ext(normalized))
	return strings.TrimPrefix(normalized, "Maps/")
}

func isMapBinPath(path string) bool {
	normalized := strings.ReplaceAll(path, "\\", "/")
	return strings.HasPrefix(normalized, "Maps/") && strings.HasSuffix(strings.ToLower(normalized), ".bin")
}

// CountCollectibles scans every map of one mod, zipped or unpacked, and returns per-SID counts.
// A map that fails to parse is reported in Failed instead of aborting the whole mod.
func CountCollectibles(modPath string) (*MapCollectiblesResult, error) {
	info, err := os.Stat(modPath)
	if err != nil {
		return nil, err
	}

	result := &MapCollectiblesResult{Success: true, Maps: map[string]*MapCollectibleCounts{}, Failed: map[string]string{}}
	if info.IsDir() {
		err = countCollectiblesInFolderMod(modPath, result)
	} else {
		err = countCollectiblesInZipMod(modPath, result)
	}
	if err != nil {
		return nil, err
	}
	return result, nil
}

func countCollectiblesInZipMod(modPath string, result *MapCollectiblesResult) error {
	reader, err := zip.OpenReader(modPath)
	if err != nil {
		return err
	}
	defer reader.Close()

	for _, file := range reader.File {
		if !isMapBinPath(file.Name) {
			continue
		}
		sid := sidFromMapPath(file.Name)
		counts, err := readZipEntryMap(file)
		if err != nil {
			result.Failed[sid] = err.Error()
			continue
		}
		result.Maps[sid] = counts
	}
	return nil
}

func readZipEntryMap(file *zip.File) (*MapCollectibleCounts, error) {
	rc, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, err
	}
	return countCollectiblesInMap(data)
}

func countCollectiblesInFolderMod(modPath string, result *MapCollectiblesResult) error {
	mapsDir := filepath.Join(modPath, "Maps")
	if _, err := os.Stat(mapsDir); err != nil {
		return nil
	}

	return filepath.WalkDir(mapsDir, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil || entry.IsDir() || !strings.EqualFold(filepath.Ext(path), ".bin") {
			return nil
		}
		relative, relErr := filepath.Rel(modPath, path)
		if relErr != nil {
			return nil
		}
		sid := sidFromMapPath(relative)

		data, readErr := os.ReadFile(path)
		if readErr != nil {
			result.Failed[sid] = readErr.Error()
			return nil
		}
		counts, parseErr := countCollectiblesInMap(data)
		if parseErr != nil {
			result.Failed[sid] = parseErr.Error()
			return nil
		}
		result.Maps[sid] = counts
		return nil
	})
}
