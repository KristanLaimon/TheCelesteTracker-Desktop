package src

import "fmt"

type RecentRun struct {
    // Basic Info
    CampaignName  string `db:"campaign_name"`
    ChapterName   string `db:"chapter_name"`
    Side          string `db:"side"`          // Added: column gs.side_id
    CampaignType  string `db:"campaign_type"`
    AttemptType   string `db:"attempt_type"`
    FormattedTime string `db:"formatted_time"`

    // Statistics (Result of SUM functions)
    Deaths        int    `db:"deaths"`       // Added: sum(deaths_in_room)
    Dashes        int    `db:"dashes"`       // Added: sum(dashes_in_room)
    Jumps         int    `db:"jumps"`        // Added: sum(jumps_in_room)
    Strawberries  int    `db:"strawberries"`
}


func Query_GetRecentRunHistory(saveDataId int, userId int, pageSize int, currentPage int) ([]RecentRun, error) {
	toReturn := make([]RecentRun, 0)
  if currentPage < 1 {
	  currentPage = 1
  }
	err := Db_DoQuery(&toReturn, fmt.Sprintf(`
		select
			cc.campaign_name_id as campaign_name,
			c.name as chapter_name,
			gs.side_id as side,
			case
				when cc.campaign_name_id like '%%celeste%%' then 'Vanilla'
				else 'Mod'
			end as campaign_type,
			case
				when gs.is_goldenberry_attempt = 1 then 'GoldenAttempt'
				when gs.is_goldenberry_completed = 1 then 'GoldenCompleted'
				else 'Normal try'
			end as attempt_type,
			strftime('%%H:%%M:%%f', gs.duration_ms / 1000.0, 'unixepoch') AS formatted_time,
			sum(gscrs.deaths_in_room) as deaths,
			sum(gscrs.dashes_in_room) as dashes,
			sum(gscrs.jumps_in_room) as jumps,
			sum(gscrs.strawberries_achieved_in_room) as strawberries
			from GameSessions gs

			join Chapters c on gs.chapter_sid = c.sid
			join Campaigns cc on c.campaign_id = cc.id
			join SaveDatas sd on cc.save_data_id = sd.id
			join Users u on sd.user_id = u.id

			right join GameSessionChapterRoomStats gscrs on gscrs.gamesession_id = gs.id
			where u.id == %d and sd.id = %d
			group by c.name, cc.campaign_name_id
			order by gs.date_time_start
			limit $d offset ($d - 1) * $d;
	`, userId, saveDataId,pageSize, currentPage, pageSize));

	if err != nil {
		return []RecentRun{}, err
	}

	return toReturn, nil
}
