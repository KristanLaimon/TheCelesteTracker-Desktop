import { injectable } from 'tsyringe';
import { Log_Error } from './Logger';

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

export type GBApiResponse_ItemExistsById = [boolean];
export type GBApiReponse_ItemExistsById = GBApiResponse_ItemExistsById;

export type GBCreditMember = [string, string, number | string, string];

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

export type GbMemberApi_Reponse = {
	id: number;
	name: string;
	avatar: string;
	date?: number;
};

@injectable()
export default class GameBananaApi {
	public async ItemExistsById(itemType: GB_ItemType, itemId: number): Promise<boolean> {
		try {
			const res = await fetch(`https://api.gamebanana.com/Core/Item/IdentifyById?itemtype=${itemType}&itemid=${itemId}&format=json`);
			if (!res.ok) return false;
			const resJson = (await res.json()) as GBApiResponse_ItemExistsById;
			return Boolean(resJson?.[0]);
		} catch (e) {
			Log_Error('GameBananaApi.ItemExistsById failed:', e);
			return false;
		}
	}

	public async GetItemInfo<T extends GB_ItemType>(
		itemType: T,
		itemId: number,
		fields: Array<GB_AllowedFieldsType[T][keyof GB_AllowedFieldsType[T]]>,
		// biome-ignore lint/suspicious/noExplicitAny: GameBanana API returns variable array shapes
	): Promise<any[]> {
		try {
			const res = await fetch(`https://api.gamebanana.com/Core/Item/Data?itemtype=${itemType}&itemid=${itemId}&fields=${fields.join(',')}`);
			if (!res.ok) return [];
			// biome-ignore lint/suspicious/noExplicitAny: GameBanana API returns variable array shapes
			return (await res.json()) as any[];
		} catch (e) {
			Log_Error('GameBananaApi.GetItemInfo failed:', e);
			return [];
		}
	}

	public async GetUsersMetadataByUsernames(usernames: string[]): Promise<GbMemberApi_Reponse[]> {
		if (usernames.length === 0) return [];

		const queryParams = usernames.map((username, index) => `username[${index}]=${encodeURIComponent(username)}`).join('&');
		const url = `https://api.gamebanana.com/Core/Member/Match?${queryParams}`;

		let matchedUserIds: number[] = [];
		try {
			const res = await fetch(url, {
				headers: {
					'Content-Type': 'application/json',
				},
			});
			if (res.ok) {
				const json = await res.json();
				if (Array.isArray(json)) {
					matchedUserIds = json.map((item) => (typeof item === 'number' ? item : item?.id)).filter(Boolean);
				} else if (typeof json === 'object' && json !== null) {
					matchedUserIds = Object.values(json)
						.map((val) => Number(val))
						.filter((id) => !Number.isNaN(id) && id > 0);
				}
			} else {
				Log_Error('GameBananaApi: GetUserMetadataByUsernames success but not code 200 (OK) | -> ', res);
			}
		} catch (e: unknown) {
			Log_Error('GameBananaApi: GetUserMetadataByUsernames failed:', e);
		}

		if (matchedUserIds.length === 0) return [];
		const fields = [GB_AllowedFields.Member.Name, GB_AllowedFields.Member.UrlAvatar, GB_AllowedFields.Member.Date] as const;
		const members: GbMemberApi_Reponse[] = [];
		for (const userId of matchedUserIds) {
			const data = await this.GetItemInfo('Member', userId, fields as unknown as Array<GB_AllowedFieldsType['Member'][keyof GB_AllowedFieldsType['Member']]>);
			if (data && data.length > 0) {
				members.push({
					id: userId,
					name: (data[0] as string) ?? null,
					avatar: (data[1] as string) ?? null,
					date: (data[2] as number) ?? null,
				});
			}
		}

		return members;
	}

	public async GetModData(itemId: number): Promise<GBApiResponse_ModInfo | null> {
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

		try {
			const data = await this.GetItemInfo('Mod', itemId, fields as unknown as Array<GB_AllowedFieldsType['Mod'][keyof GB_AllowedFieldsType['Mod']]>);
			if (!data || data.length === 0) return null;

			let parsedAuthors: GBCreditsAndGroups = {};
			try {
				if (data[0]) {
					parsedAuthors = JSON.parse(data[0]) as GBCreditsAndGroups;
				}
			} catch (e) {
				Log_Error('Failed to parse GameBanana authors JSON:', e);
			}

			return {
				authors: parsedAuthors,
				CategoryName: data[1] as string,
				catid: data[2] as number,
				creator: data[3] as string,
				date: data[4] as number,
				description: data[5] as string,
				downloads: data[6] as number,
				likes: data[7] as number,
				mdate: data[8] as number,
				name: data[9] as string,
				UrlDownload: data[10] as string,
				userid: data[11] as number,
				views: data[12] as number,
			};
		} catch (e) {
			Log_Error('GameBananaApi.GetModData failed:', e);
			return null;
		}
	}
}
