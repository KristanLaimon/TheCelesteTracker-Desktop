import { injectable } from 'tsyringe';

// Api inputs
export const GB_ItemType = ['Mod', 'Member'] as const;
export type GB_ItemType = (typeof GB_ItemType)[number];

export const GB_AllowedFields = {
	Mod: {
		AppsUsed: 'apps_used',
		Authors: 'authors',
		CategoryName: 'Category().name',
		CatId: 'catid',
		ContestId: 'contestid',
		Creator: 'creator',
		CreditsAuthors: 'Credits().aAuthors()',
		CreditsAuthorsGroups: 'Credits().aAuthorsAndGroups()',
		CreditsSsvAuthorNames: 'Credits().ssvAuthorNames()',
		Date: 'date',
		Description: 'description',
		Downloads: 'downloads',
		FeedbackInstructions: 'feedback_instructions',
		Files: 'Files().aFiles()',
		GameName: 'Game().name',
		InstallInstructions: 'install_instructions',
		IsObsolete: 'is_obsolete',
		LastPostDate: 'lastpost_date',
		LastPostUserId: 'lastpost_userid',
		Likes: 'likes',
		MDate: 'mdate',
		ModNote: 'modnote',
		Name: 'name',
		Nsfw: 'Nsfw().bIsNsfw()',
		ObsolNotice: 'obsol_notice',
		OwnerName: 'Owner().name',
		PostCount: 'postcount',
		PostsLastPostIdPosterRow: 'Posts().LastPost().idPosterRow()',
		PostsLastPostText: 'Posts().LastPost().sText()',
		PostsLastPostDateAdded: 'Posts().LastPost().tsDateAdded()',
		PostsPostcountNPostCount: 'Posts().Postcount().nPostCount()',
		PreviewStructuredData: 'Preview().sStructuredDataFullsizeUrl()',
		PreviewSubFeedImage: 'Preview().sSubFeedImageUrl()',
		RootCategoryId: 'RootCategory().id',
		RootCategoryName: 'RootCategory().name',
		Screenshots: 'screenshots',
		StudioId: 'studioid',
		Text: 'text',
		Trash: 'Trash().bIsTrashed()',
		UDate: 'udate',
		UpdatesGetLatest: 'Updates().aGetLatestUpdates()',
		UpdatesLatest: 'Updates().aLatestUpdates()',
		UpdatesHasUpdates: 'Updates().bSubmissionHasUpdates()',
		UpdatesCount: 'Updates().nUpdatesCount()',
		UrlDownload: 'Url().sDownloadUrl()',
		UrlEdit: 'Url().sEditUrl()',
		UrlEmbeddables: 'Url().sEmbeddablesUrl()',
		UrlHistory: 'Url().sHistoryUrl()',
		UrlProfile: 'Url().sProfileUrl()',
		UrlTrash: 'Url().sTrashUrl()',
		UrlUntrash: 'Url().sUntrashUrl()',
		UrlUpdates: 'Url().sUpdatesUrl()',
		UrlWithhold: 'Url().sWithholdUrl()',
		UserId: 'userid',
		Views: 'views',
		Withhold: 'Withhold().bIsWithheld()',
	},
	Member: {
		AffiliatedStudio: 'AffiliatedStudio().aAffiliatedStudio()',
		Ban: 'Ban().bIsBanned()',
		BuddiesHasBuddies: 'Buddies().bHasBuddies()',
		BuddiesHasOnline: 'Buddies().Count().bHasOnlineBuddies()',
		BuddiesCount: 'Buddies().Count().nCount()',
		BuddiesOnlineCount: 'Buddies().Count().nGetOnlineBuddiesCount()',
		BuddiesList: 'Buddies().List().aBuddyRowIds()',
		BuddiesOnlineList: 'Buddies().List().aOnlineBuddyRowIds()',
		ContestsParticipated: 'Contests().aActiveContestRowIdsParticipatedIn()',
		ContestsIsParticipating: 'Contests().bIsParticipatingInActiveContests()',
		Date: 'date',
		Bio: 'DefinitionList().aBio()',
		ContactInfo: 'DefinitionList().aContactInfo()',
		DonationMethods: 'DefinitionList().aDonationMethods()',
		PcSpecs: 'DefinitionList().aPcSpecs()',
		SoftwareKit: 'DefinitionList().aSoftwareKit()',
		EventsParticipated: 'Events().aActiveEventRowIdsParticipatedIn()',
		EventsIsParticipating: 'Events().bIsParticipatingInActiveEvents()',
		GagSections: 'Gag().aGetSectionsMemberIsGaggedFrom()',
		GagIsGagged: 'Gag().bIsGaggedFromAnySection()',
		GuildIsIn: 'Guild().bMemberIsInAnyGuild()',
		InitiativesParticipation: 'Initiatives().aInitiativeParticipation()',
		InitiativesIsIn: 'Initiatives().bIsInInitiatives()',
		LastPostDate: 'lastpost_date',
		LastPostUserId: 'lastpost_userid',
		MDate: 'mdate',
		MedalsLegendary: 'Medals().aLegendaryMedals()',
		Medals: 'Medals().aMedals()',
		MedalsNormal: 'Medals().aNormalMedals()',
		MedalsRare: 'Medals().aRareMedals()',
		ModgroupIsNotPartOf: 'Modgroup().aModgroupsMemberIsNotPartOf()',
		ModgroupIsPartOf: 'Modgroup().aModgroupsMemberIsPartOf()',
		ModgroupIsAdmin: 'Modgroup().bIsAdmin()',
		ModgroupIsIn: 'Modgroup().bIsInAnyModgroup()',
		ModgroupIsModerator: 'Modgroup().bIsModerator()',
		ModgroupIsSuperAdmin: 'Modgroup().bIsSuperAdmin()',
		ModgroupIsSuperModerator: 'Modgroup().bIsSuperModerator()',
		Name: 'name',
		OnlineIsOnline: 'OnlineStatus().bIsOnline()',
		OnlineLocation: 'OnlineStatus().sLocation()',
		OnlineLastSeen: 'OnlineStatus().tsLastSeenTime()',
		OnlineSessionStart: 'OnlineStatus().tsSessionCreationTime()',
		PostCount: 'postcount',
		PostsLastPostId: 'Posts().LastPost().idPosterRow()',
		PostsLastPostText: 'Posts().LastPost().sText()',
		PostsLastPostDate: 'Posts().LastPost().tsDateAdded()',
		PostsPostCount: 'Posts().Postcount().nPostCount()',
		PreviewFullsize: 'Preview().sStructuredDataFullsizeUrl()',
		PreviewSubFeed: 'Preview().sSubFeedImageUrl()',
		TrashIsTrashed: 'Trash().bIsTrashed()',
		UnlocksEnabled: 'Unlocks().aGetEnabledUnlocks()',
		UrlActivation: 'Url().sActivationUrl()',
		UrlAvatar: 'Url().sAvatarUrl()',
		UrlBuddies: 'Url().sBuddiesUrl()',
		UrlBuddyRequests: 'Url().sBuddyRequestsUrl()',
		UrlEdit: 'Url().sEditUrl()',
		UrlHdAvatar: 'Url().sHdAvatarUrl()',
		UrlHistory: 'Url().sHistoryUrl()',
		UrlItemBase: 'Url().sItemBaseUrl()',
		UrlLogin: 'Url().sLoginUrl()',
		UrlMedals: 'Url().sMedalsUrl()',
		UrlPointsLog: 'Url().sPointsLogUrl()',
		UrlProfile: 'Url().sProfileUrl()',
		UrlReconfirmation: 'Url().sReconfirmationUrl()',
		UrlResetPassword: 'Url().sResetPasswordUrl()',
		UrlSettings: 'Url().sSettingsUrl()',
		UrlSig: 'Url().sSigUrl()',
		UrlStampsLog: 'Url().sStampsLogUrl()',
		UrlSubscribers: 'Url().sSubscribersUrl()',
		UrlTrash: 'Url().sTrashUrl()',
		UrlUntrash: 'Url().sUntrashUrl()',
		UrlUpic: 'Url().sUpicUrl()',
		UserTitle: 'user_title',
		WatchesCount: 'Watches().nGetWatchedSubmissionCount()',
		WithholdsHasWithheld: 'Withholds().bHasWithheldSubmissions()',
	},
} as const satisfies { [K in GB_ItemType]: Record<string, string> };

export type GB_AllowedFieldsType = typeof GB_AllowedFields;

// Api Responses
export type GBApiReponse_ItemExistsById = [boolean];

// Represents a single credited member in the tuple format:
// [Name, Subtitle/Role, UserId, Avatar/Extra]
export type GBCreditMember = [string, string, number | string, string];

// Represents the entire parsed JSON object with strong typing for common groups
export interface GBCreditsAndGroups {
	scatterbrain?: GBCreditMember[];
	playtesters?: GBCreditMember[];
	assets?: GBCreditMember[];
	'Special Thanks'?: GBCreditMember[];
	[group: string]: GBCreditMember[] | undefined;
}

export interface GBApiResponse_ModInfo {
	authors: GBCreditsAndGroups;
	CategoryName: string;
	catid: number;
	creator: string;
	date: number;
	description: string;
	downloads: number;
	likes: number;
	mdate: number;
	name: string;
	UrlDownload: string;
	userid: number;
	views: number;
}

// Main code
@injectable()
export default class GameBananaApi {
	public async ItemExistsById(itemType: GB_ItemType, itemId: number): Promise<boolean> {
		const res = await fetch(`https://api.gamebanana.com/Core/Item/IdentifyById?itemtype=${itemType}&itemid=${itemId}&format=json`);
		const resJson = (await res.json()) as GBApiReponse_ItemExistsById;
		return resJson[0];
	}

	// Método dinámico general
	public async GetItemInfo<T extends GB_ItemType>(itemType: T, itemId: number, fields: Array<GB_AllowedFieldsType[T][keyof GB_AllowedFieldsType[T]]>) {
		const res = await fetch(`https://api.gamebanana.com/Core/Item/Data?itemtype=${itemType}&itemid=${itemId}&fields=${fields.join(',')}`);
		// biome-ignore lint/suspicious/noExplicitAny: Game banana's api could return a variable shape depending in fields query param
		const resJson = (await res.json()) as any[];

		return fields.reduce(
			(acc, field, index) => {
				acc[field as string] = resJson[index];
				return acc;
			},
			// biome-ignore lint/suspicious/noExplicitAny: Game banana's api could return a variable shape depending in fields query param
			{} as Record<string, any>,
		);
	}

	public async GetModData(itemId: number): Promise<GBApiResponse_ModInfo> {
		const fields = [
			GB_AllowedFields.Mod.Authors,
			GB_AllowedFields.Mod.CategoryName,
			GB_AllowedFields.Mod.CatId,
			GB_AllowedFields.Mod.Creator,
			GB_AllowedFields.Mod.Date,
			GB_AllowedFields.Mod.Description,
			GB_AllowedFields.Mod.Downloads,
			GB_AllowedFields.Mod.Likes,
			GB_AllowedFields.Mod.MDate,
			GB_AllowedFields.Mod.Name,
			GB_AllowedFields.Mod.UrlDownload,
			GB_AllowedFields.Mod.UserId,
			GB_AllowedFields.Mod.Views,
		] as const;

		const url = `https://api.gamebanana.com/Core/Item/Data?itemtype=Mod&itemid=${itemId}&fields=${fields.join(',')}`;
		const res = await fetch(url);
		// biome-ignore lint/suspicious/noExplicitAny: Game banana's api could return a variable shape depending in fields query paramv
		const data = (await res.json()) as any[];

		let parsedAuthors: GBCreditsAndGroups = {};
		try {
			if (data[0]) {
				parsedAuthors = JSON.parse(data[0]) as GBCreditsAndGroups;
			}
		} catch (e) {
			console.error('Failed to parse GameBanana authors JSON:', e);
		}

		return {
			authors: parsedAuthors,
			CategoryName: data[1],
			catid: data[2],
			creator: data[3],
			date: data[4],
			description: data[5],
			downloads: data[6],
			likes: data[7],
			mdate: data[8],
			name: data[9],
			UrlDownload: data[10],
			userid: data[11],
			views: data[12],
		};
	}
}
