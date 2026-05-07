export namespace src {
	
	export class CampaignItem {
	    id: number;
	    campaignNameId: string;
	    coverImgPath: string;
	
	    static createFrom(source: any = {}) {
	        return new CampaignItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.campaignNameId = source["campaignNameId"];
	        this.coverImgPath = source["coverImgPath"];
	    }
	}
	export class Collection {
	    id: number;
	    name: string;
	    userId: number;
	
	    static createFrom(source: any = {}) {
	        return new Collection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.userId = source["userId"];
	    }
	}
	export class GlobalStats {
	    totalCampaigns: number;
	    totalChapters: number;
	    totalSides: number;
	    totalRooms: number;
	    totalPlaytime: number;
	    totalDeaths: number;
	    totalDashes: number;
	    totalStrawberries: number;
	    totalHearts: number;
	    totalGoldenStrawberries: number;
	
	    static createFrom(source: any = {}) {
	        return new GlobalStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalCampaigns = source["totalCampaigns"];
	        this.totalChapters = source["totalChapters"];
	        this.totalSides = source["totalSides"];
	        this.totalRooms = source["totalRooms"];
	        this.totalPlaytime = source["totalPlaytime"];
	        this.totalDeaths = source["totalDeaths"];
	        this.totalDashes = source["totalDashes"];
	        this.totalStrawberries = source["totalStrawberries"];
	        this.totalHearts = source["totalHearts"];
	        this.totalGoldenStrawberries = source["totalGoldenStrawberries"];
	    }
	}
	export class LevelCollectionStats {
	    campaignId: number;
	    campaignName: string;
	    lobbyId?: number;
	    lobbyName?: string;
	    levelName: string;
	    levelSide: string;
	    totalTime: number;
	    strawberries: number;
	    goldenStrawberries: number;
	    hearts: number;
	    deaths: number;
	    dashes: number;
	    coverImgPath?: string;
	    iconImgPath?: string;
	
	    static createFrom(source: any = {}) {
	        return new LevelCollectionStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.campaignId = source["campaignId"];
	        this.campaignName = source["campaignName"];
	        this.lobbyId = source["lobbyId"];
	        this.lobbyName = source["lobbyName"];
	        this.levelName = source["levelName"];
	        this.levelSide = source["levelSide"];
	        this.totalTime = source["totalTime"];
	        this.strawberries = source["strawberries"];
	        this.goldenStrawberries = source["goldenStrawberries"];
	        this.hearts = source["hearts"];
	        this.deaths = source["deaths"];
	        this.dashes = source["dashes"];
	        this.coverImgPath = source["coverImgPath"];
	        this.iconImgPath = source["iconImgPath"];
	    }
	}
	export class RecentRun {
	    CampaignName: string;
	    ChapterName: string;
	    Side: string;
	    CampaignType: string;
	    AttemptType: string;
	    FormattedTime: string;
	    Deaths: number;
	    Dashes: number;
	    Jumps: number;
	    Strawberries: number;
	
	    static createFrom(source: any = {}) {
	        return new RecentRun(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.CampaignName = source["CampaignName"];
	        this.ChapterName = source["ChapterName"];
	        this.Side = source["Side"];
	        this.CampaignType = source["CampaignType"];
	        this.AttemptType = source["AttemptType"];
	        this.FormattedTime = source["FormattedTime"];
	        this.Deaths = source["Deaths"];
	        this.Dashes = source["Dashes"];
	        this.Jumps = source["Jumps"];
	        this.Strawberries = source["Strawberries"];
	    }
	}

}

