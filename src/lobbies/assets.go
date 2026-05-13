package lobbies

type AssetRef struct {
	Name    string
	Payload any
}

type AssetContext interface {
	Entries() map[string]string
	GlobalAssets() map[string]AssetRef
	ReadText(name string) (string, bool)
	ResolveAsset(archivePath string) (AssetRef, bool)
}

type ChapterIconResolver interface {
	ResolveChapterIconAsset(ctx AssetContext, chapterSID string) (AssetRef, bool)
}
