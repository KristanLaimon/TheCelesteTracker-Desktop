package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
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
