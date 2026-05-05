export namespace src {
	
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

