package src

import "fmt"

type RecentRun struct {
	ID string `db:"id"`

	// Basic Info
	CampaignName  string `db:"campaign_name"`
	ChapterSID    string `db:"chapter_sid"`
	ChapterName   string `db:"chapter_name"`
	IconImgPath   string `db:"icon_img_path"`
	Side          string `db:"side"` // Added: column gs.side_id
	CampaignType  string `db:"campaign_type"`
	AttemptType   string `db:"attempt_type"`
	FormattedTime string `db:"formatted_time"`

	// Statistics (Result of SUM functions)
	Deaths       int `db:"deaths"` // Added: sum(deaths_in_room)
	Dashes       int `db:"dashes"` // Added: sum(dashes_in_room)
	Jumps        int `db:"jumps"`  // Added: sum(jumps_in_room)
	Strawberries int `db:"strawberries"`
}

type MonthlyRunStats struct {
	Month            string `db:"month" json:"month"`
	Runs             int    `db:"runs" json:"runs"`
	PlaytimeMs       int64  `db:"playtime_ms" json:"playtimeMs"`
	Deaths           int    `db:"deaths" json:"deaths"`
	Dashes           int    `db:"dashes" json:"dashes"`
	Jumps            int    `db:"jumps" json:"jumps"`
	Strawberries     int    `db:"strawberries" json:"strawberries"`
	GoldenAttempts   int    `db:"golden_attempts" json:"goldenAttempts"`
	GoldenCompletions int    `db:"golden_completions" json:"goldenCompletions"`
	ModRuns          int    `db:"mod_runs" json:"modRuns"`
	VanillaRuns      int    `db:"vanilla_runs" json:"vanillaRuns"`
}

func Query_GetRecentRunHistory(saveDataId int, userId int, pageSize int, currentPage int) ([]RecentRun, error) {
	toReturn := make([]RecentRun, 0)
	if currentPage < 1 {
		currentPage = 1
	}
	err := Db_Select(&toReturn, fmt.Sprintf(`
		select
			gs.id as id,
			cc.campaign_name_id as campaign_name,
			c.sid as chapter_sid,
			c.name as chapter_name,
			coalesce(c.icon_img_path, '') as icon_img_path,
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
			group by gs.id
			order by gs.date_time_start desc
			limit %d offset (%d - 1) * %d;
	`, userId, saveDataId, pageSize, currentPage, pageSize))

	if err != nil {
		return []RecentRun{}, err
	}

	return toReturn, nil
}

func Query_GetMonthlyRunStats(saveDataId int, userId int) ([]MonthlyRunStats, error) {
	toReturn := make([]MonthlyRunStats, 0)

	err := Db_Select(&toReturn, fmt.Sprintf(`
		with session_stats as (
			select
				gs.id,
				strftime('%%Y-%%m', gs.date_time_start) as month,
				gs.duration_ms,
				gs.is_goldenberry_attempt,
				gs.is_goldenberry_completed,
				case
					when cc.campaign_name_id like '%%celeste%%' then 'Vanilla'
					else 'Mod'
				end as campaign_type,
				coalesce(sum(gscrs.deaths_in_room), 0) as deaths,
				coalesce(sum(gscrs.dashes_in_room), 0) as dashes,
				coalesce(sum(gscrs.jumps_in_room), 0) as jumps,
				coalesce(sum(gscrs.strawberries_achieved_in_room), 0) as strawberries
			from GameSessions gs
			join Chapters c on gs.chapter_sid = c.sid
			join Campaigns cc on c.campaign_id = cc.id
			join SaveDatas sd on cc.save_data_id = sd.id
			join Users u on sd.user_id = u.id
			left join GameSessionChapterRoomStats gscrs on gscrs.gamesession_id = gs.id
			where u.id = %d
				and sd.id = %d
				and gs.date_time_start >= date('now', 'start of month', '-11 months')
			group by gs.id
		)
		select
			month,
			count(*) as runs,
			coalesce(sum(duration_ms), 0) as playtime_ms,
			coalesce(sum(deaths), 0) as deaths,
			coalesce(sum(dashes), 0) as dashes,
			coalesce(sum(jumps), 0) as jumps,
			coalesce(sum(strawberries), 0) as strawberries,
			coalesce(sum(is_goldenberry_attempt), 0) as golden_attempts,
			coalesce(sum(is_goldenberry_completed), 0) as golden_completions,
			coalesce(sum(case when campaign_type = 'Mod' then 1 else 0 end), 0) as mod_runs,
			coalesce(sum(case when campaign_type = 'Vanilla' then 1 else 0 end), 0) as vanilla_runs
		from session_stats
		where month is not null
		group by month
		order by month asc;
	`, userId, saveDataId))

	if err != nil {
		return []MonthlyRunStats{}, err
	}

	return toReturn, nil
}

type GlobalStats struct {
	TotalCampaigns          int   `db:"TotalCampaigns" json:"totalCampaigns"`
	TotalChapters           int   `db:"TotalChapters" json:"totalChapters"`
	TotalSides              int   `db:"TotalSides" json:"totalSides"`
	TotalRooms              int   `db:"TotalRooms" json:"totalRooms"`
	TotalPlaytime           int64 `db:"TotalPlaytime" json:"totalPlaytime"`
	TotalDeaths             int   `db:"TotalDeaths" json:"totalDeaths"`
	TotalDashes             int   `db:"TotalDashes" json:"totalDashes"`
	TotalStrawberries       int   `db:"TotalStrawberries" json:"totalStrawberries"`
	TotalHearts             int   `db:"TotalHearts" json:"totalHearts"`
	TotalGoldenStrawberries int   `db:"TotalGoldenStrawberries" json:"totalGoldenStrawberries"`
}

func Query_GetGlobalStats(saveDataId int, userId int) ([]GlobalStats, error) {
	toReturn := make([]GlobalStats, 0)

	err := Db_Select(&toReturn, fmt.Sprintf(`
		SELECT
    COUNT(DISTINCT c.id) AS TotalCampaigns,
    COUNT(DISTINCT ch.sid) AS TotalChapters,
    COUNT(DISTINCT cs.chapter_sid || '-' || cs.side_id) AS TotalSides,
    COUNT(DISTINCT csr.chapter_sid || '-' || csr.side_id || '-' || csr.name) AS TotalRooms,
    -- Subconsulta para Tiempo
    (SELECT IFNULL(SUM(gs.duration_ms), 0)
     FROM GameSessions gs
     WHERE gs.chapter_sid IN (
         SELECT sid FROM Chapters WHERE campaign_id IN (
             SELECT id FROM Campaigns WHERE save_data_id = sd.id
         )
     )) AS TotalPlaytime,
    -- Subconsulta para Muertes
    (SELECT IFNULL(SUM(gscrs.deaths_in_room), 0)
     FROM GameSessionChapterRoomStats gscrs
     WHERE gscrs.chapter_sid IN (
         SELECT sid FROM Chapters WHERE campaign_id IN (
             SELECT id FROM Campaigns WHERE save_data_id = sd.id
         )
     )) AS TotalDeaths,
     (SELECT IFNULL(SUM(gscrs.dashes_in_room ), 0)
     FROM GameSessionChapterRoomStats gscrs
     WHERE gscrs.chapter_sid IN (
         SELECT sid FROM Chapters WHERE campaign_id IN (
             SELECT id FROM Campaigns WHERE save_data_id = sd.id
         )
     )) AS TotalDashes,
     (SELECT IFNULL(SUM(gscrs.strawberries_achieved_in_room), 0)
     FROM GameSessionChapterRoomStats gscrs
     WHERE gscrs.chapter_sid IN (
         SELECT sid FROM Chapters WHERE campaign_id IN (
             SELECT id FROM Campaigns WHERE save_data_id = sd.id
         )
     )) AS TotalStrawberries,
     (SELECT IFNULL(SUM(gscrs.hearts_achieved_in_room ), 0)
     FROM GameSessionChapterRoomStats gscrs
     WHERE gscrs.chapter_sid IN (
         SELECT sid FROM Chapters WHERE campaign_id IN (
             SELECT id FROM Campaigns WHERE save_data_id = sd.id
         )
     )) AS TotalHearts,
     (SELECT IFNULL(SUM(cs2.goldenstrawberry_achieved), 0)
      FROM ChapterSides cs2
      WHERE cs2.chapter_sid IN (
       SELECT sid from Chapters WHERE campaign_id IN (
       	SELECT id FROM Campaigns WHERE save_data_id = sd.id
      ))) as TotalGoldenStrawberries
		FROM Users u
		JOIN SaveDatas sd ON u.id = sd.user_id
		JOIN Campaigns c ON sd.id = c.save_data_id
		LEFT JOIN Chapters ch ON c.id = ch.campaign_id
		LEFT JOIN ChapterSides cs ON ch.sid = cs.chapter_sid
		LEFT JOIN ChapterSideRooms csr ON cs.chapter_sid = csr.chapter_sid AND cs.side_id = csr.side_id
		WHERE u.id = %d AND sd.id = %d;
	`, userId, saveDataId))

	if err != nil {
		return []GlobalStats{}, err
	}

	return toReturn, nil
}
