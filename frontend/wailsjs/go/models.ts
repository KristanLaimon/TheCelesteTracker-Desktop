export namespace src {
	
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

