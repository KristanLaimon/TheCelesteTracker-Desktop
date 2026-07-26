package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

func zipReadTextFile(zipPath, filePath string) (string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return "", err
	}
	defer r.Close()

	for _, f := range r.File {
		if strings.EqualFold(f.Name, filePath) {
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			defer rc.Close()
			b, err := io.ReadAll(rc)
			return string(b), err
		}
	}
	return "", fmt.Errorf("not found: %s", filePath)
}

func zipList(zipPath string) ([]string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	seen := map[string]bool{}
	var files []string
	for _, f := range r.File {
		if !seen[f.Name] {
			files = append(files, f.Name)
			seen[f.Name] = true
		}
		dir := f.Name
		for {
			idx := -1
			for i := len(dir) - 1; i >= 0; i-- {
				if dir[i] == '/' || dir[i] == '\\' {
					idx = i
					break
				}
			}
			if idx < 0 {
				break
			}
			dir = dir[:idx+1]
			if !seen[dir] {
				files = append(files, dir)
				seen[dir] = true
			}
			dir = dir[:idx]
		}
	}
	return files, nil
}

func unzip(zipPath, dest string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		path := filepath.Join(dest, f.Name)
		// ponytail: keep zipslip check. security boundary.
		if !strings.HasPrefix(path, filepath.Clean(dest)+string(os.PathSeparator)) {
			return fmt.Errorf("zipslip: %s", f.Name)
		}

		if f.FileInfo().IsDir() {
			os.MkdirAll(path, os.ModePerm)
			continue
		}

		os.MkdirAll(filepath.Dir(path), os.ModePerm)
		rc, err := f.Open()
		if err != nil {
			return err
		}

		out, err := os.Create(path)
		if err != nil {
			rc.Close()
			return err
		}

		io.Copy(out, rc)
		out.Close()
		rc.Close()
	}
	return nil
}

func zipFolder(src, dest string) error {
	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()

	w := zip.NewWriter(f)
	defer w.Close()

	// ponytail: WalkDir faster than Walk. anonymous func defer clears fd per file safely.
	return filepath.WalkDir(src, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		rel, _ := filepath.Rel(src, path)
		zf, err := w.Create(filepath.ToSlash(rel))
		if err != nil {
			return err
		}

		srcF, err := os.Open(path)
		if err != nil {
			return err
		}
		defer srcF.Close()

		_, err = io.Copy(zf, srcF)
		return err
	})
}

type ScannedModRaw struct {
	FileName     string            `json:"fileName"`
	IsZip        bool              `json:"isZip"`
	ModPath      string            `json:"modPath"`
	SizeBytes    int64             `json:"sizeBytes"`
	YamlContent  string            `json:"yamlContent"`
	CollabID     string            `json:"collabId,omitempty"`
	DialogFiles  map[string]string `json:"dialogFiles,omitempty"`
	LazyLoadYaml string            `json:"lazyLoadYaml,omitempty"`
	MapFiles     []ScannedMapRaw   `json:"mapFiles,omitempty"`
}

type ScannedMapRaw struct {
	Path     string `json:"path"`
	MetaYaml string `json:"metaYaml,omitempty"`
}

type ZipScanModsResult struct {
	Success  bool            `json:"success"`
	ModCount int             `json:"modCount"`
	Threads  int             `json:"threads"`
	Mods     []ScannedModRaw `json:"mods"`
	Error    string          `json:"error,omitempty"`
}

func zipScanMods(modsDir string, numThreads int) (*ZipScanModsResult, error) {
	entries, err := os.ReadDir(modsDir)
	if err != nil {
		return &ZipScanModsResult{Success: false, Error: err.Error()}, err
	}

	type modItem struct {
		fileName string
		isZip    bool
		path     string
		size     int64
	}

	var items []modItem
	for _, e := range entries {
		name := e.Name()
		lowerName := strings.ToLower(name)
		if e.IsDir() {
			if strings.Contains(lowerName, "cache") {
				continue
			}
			items = append(items, modItem{fileName: name, isZip: false, path: filepath.Join(modsDir, name), size: 0})
		} else if strings.HasSuffix(lowerName, ".zip") {
			info, err := e.Info()
			size := int64(0)
			if err == nil {
				size = info.Size()
			}
			items = append(items, modItem{fileName: name, isZip: true, path: filepath.Join(modsDir, name), size: size})
		}
	}

	workerCount := numThreads
	if workerCount <= 0 {
		workerCount = runtime.NumCPU()
	}
	if workerCount <= 0 {
		workerCount = 4
	}

	jobs := make(chan modItem, len(items))
	for _, item := range items {
		jobs <- item
	}
	close(jobs)

	var mu sync.Mutex
	var results []ScannedModRaw
	var wg sync.WaitGroup

	yamlNames := []string{"everest.yaml", "everest.yml", "Everest.yaml", "Everest.yml"}

	for w := 0; w < workerCount; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for item := range jobs {
				scanned, ok := scanSingleModGo(item.path, item.fileName, item.isZip, item.size, yamlNames)
				if ok {
					mu.Lock()
					results = append(results, scanned)
					mu.Unlock()
				}
			}
		}()
	}

	wg.Wait()

	return &ZipScanModsResult{
		Success:  true,
		ModCount: len(results),
		Threads:  workerCount,
		Mods:     results,
	}, nil
}

func scanSingleModGo(modPath, fileName string, isZip bool, sizeBytes int64, yamlNames []string) (ScannedModRaw, bool) {
	if isZip {
		return scanZipModGo(modPath, fileName, sizeBytes, yamlNames)
	}
	return scanFolderModGo(modPath, fileName, yamlNames)
}

func scanZipModGo(modPath, fileName string, sizeBytes int64, yamlNames []string) (ScannedModRaw, bool) {
	r, err := zip.OpenReader(modPath)
	if err != nil {
		return ScannedModRaw{}, false
	}
	defer r.Close()

	fileMap := make(map[string]*zip.File, len(r.File))
	for _, f := range r.File {
		fileMap[strings.ToLower(strings.ReplaceAll(f.Name, "\\", "/"))] = f
	}

	var yamlContent string
	for _, yName := range yamlNames {
		if zf, ok := fileMap[strings.ToLower(yName)]; ok {
			c, err := readZipEntryText(zf)
			if err == nil && strings.TrimSpace(c) != "" {
				yamlContent = c
				break
			}
		}
	}
	if yamlContent == "" {
		return ScannedModRaw{}, false
	}

	var collabID string
	if zf, ok := fileMap["collabutils2collabid.txt"]; ok {
		c, err := readZipEntryText(zf)
		if err == nil {
			collabID = strings.TrimSpace(c)
		}
	}

	var lazyLoadYaml string
	if zf, ok := fileMap["collabutils2lazyloading.yaml"]; ok {
		c, err := readZipEntryText(zf)
		if err == nil {
			lazyLoadYaml = c
		}
	}

	dialogFiles := make(map[string]string)
	for lowerName, zf := range fileMap {
		if strings.HasPrefix(lowerName, "dialog/") && strings.HasSuffix(lowerName, ".txt") {
			c, err := readZipEntryText(zf)
			if err == nil {
				dialogFiles[zf.Name] = c
			}
		}
	}

	var mapFiles []ScannedMapRaw
	for lowerName, zf := range fileMap {
		if strings.HasPrefix(lowerName, "maps/") && strings.HasSuffix(lowerName, ".bin") {
			metaPath := lowerName[:len(lowerName)-4] + ".meta.yaml"
			var metaContent string
			if metaZf, ok := fileMap[metaPath]; ok {
				c, err := readZipEntryText(metaZf)
				if err == nil {
					metaContent = c
				}
			}
			mapFiles = append(mapFiles, ScannedMapRaw{
				Path:     zf.Name,
				MetaYaml: metaContent,
			})
		}
	}

	modPathNormalized := filepath.ToSlash(modPath)
	return ScannedModRaw{
		FileName:     fileName,
		IsZip:        true,
		ModPath:      modPathNormalized,
		SizeBytes:    sizeBytes,
		YamlContent:  yamlContent,
		CollabID:     collabID,
		DialogFiles:  dialogFiles,
		LazyLoadYaml: lazyLoadYaml,
		MapFiles:     mapFiles,
	}, true
}

func scanFolderModGo(modPath, fileName string, yamlNames []string) (ScannedModRaw, bool) {
	var yamlContent string
	for _, yName := range yamlNames {
		p := filepath.Join(modPath, yName)
		b, err := os.ReadFile(p)
		if err == nil && strings.TrimSpace(string(b)) != "" {
			yamlContent = string(b)
			break
		}
	}
	if yamlContent == "" {
		return ScannedModRaw{}, false
	}

	var collabID string
	if b, err := os.ReadFile(filepath.Join(modPath, "CollabUtils2CollabID.txt")); err == nil {
		collabID = strings.TrimSpace(string(b))
	}

	var lazyLoadYaml string
	if b, err := os.ReadFile(filepath.Join(modPath, "CollabUtils2LazyLoading.yaml")); err == nil {
		lazyLoadYaml = string(b)
	}

	dialogFiles := make(map[string]string)
	dialogDir := filepath.Join(modPath, "Dialog")
	if _, err := os.Stat(dialogDir); err == nil {
		_ = filepath.WalkDir(dialogDir, func(path string, d os.DirEntry, err error) error {
			if err == nil && !d.IsDir() && strings.HasSuffix(strings.ToLower(d.Name()), ".txt") {
				rel, err := filepath.Rel(modPath, path)
				if err == nil {
					if b, err := os.ReadFile(path); err == nil {
						dialogFiles[filepath.ToSlash(rel)] = string(b)
					}
				}
			}
			return nil
		})
	}

	var mapFiles []ScannedMapRaw
	mapsDir := filepath.Join(modPath, "Maps")
	if _, err := os.Stat(mapsDir); err == nil {
		_ = filepath.WalkDir(mapsDir, func(path string, d os.DirEntry, err error) error {
			if err == nil && !d.IsDir() && strings.HasSuffix(strings.ToLower(d.Name()), ".bin") {
				rel, err := filepath.Rel(modPath, path)
				if err == nil {
					relSlash := filepath.ToSlash(rel)
					metaPath := path[:len(path)-4] + ".meta.yaml"
					var metaContent string
					if b, err := os.ReadFile(metaPath); err == nil {
						metaContent = string(b)
					}
					mapFiles = append(mapFiles, ScannedMapRaw{
						Path:     relSlash,
						MetaYaml: metaContent,
					})
				}
			}
			return nil
		})
	}

	modPathNormalized := filepath.ToSlash(modPath)
	return ScannedModRaw{
		FileName:     fileName,
		IsZip:        false,
		ModPath:      modPathNormalized,
		SizeBytes:    0,
		YamlContent:  yamlContent,
		CollabID:     collabID,
		DialogFiles:  dialogFiles,
		LazyLoadYaml: lazyLoadYaml,
		MapFiles:     mapFiles,
	}, true
}

func readZipEntryText(zf *zip.File) (string, error) {
	rc, err := zf.Open()
	if err != nil {
		return "", err
	}
	defer rc.Close()
	b, err := io.ReadAll(rc)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
