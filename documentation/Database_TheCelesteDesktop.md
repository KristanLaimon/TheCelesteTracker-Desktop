# YOU CAN MODIFY THIS, THIS WILL BE DE DATABASE SCHEMA CURRENTLY BEING USED this will be the database used here, so you must set SQL CODE, to addapt the schema from readonly "Database_TheCelestMod.md" schema without delete any DATA, to this file schema.

erDiagram
Users ||--o{ SaveDatas : "has"
Users ||--o{ Collections : "creates"
Users {
int id PK
string name
}

     Collections ||--o{ CollectionCampaigns : "contains"
     Collections {
         int id PK
         int user_id FK
         string name
     }

     SaveDatas ||--o{ Campaigns : "contains"
     SaveDatas {
         int id PK
         int user_id FK
         int slot_number
         string file_name
     }

     Campaigns ||--o{ CollectionCampaigns : "member_of"
     Campaigns ||--o{ Chapters : "manages"
     Campaigns {
         int id PK
         int save_data_id FK
         string campaign_name_id
         string cover_img_path "Nullable"
     }

     CollectionCampaigns {
         int collection_id PK, FK
         int campaign_id PK, FK
     }

     Chapters ||--o{ ChapterSides : "has"
     Chapters {
         string sid PK
         int campaign_id FK
         string name
         string icon_img_path "Nullable"
     }

     ChapterSideTypes ||--o{ ChapterSides : "type"
     ChapterSideTypes {
         string id PK "SIDEA, SIDEB, SIDEC"
     }

     ChapterSides ||--o{ ChapterSideRooms : "defines"
     ChapterSides ||--o{ GameSessions : "tracks"
     ChapterSides {
         string chapter_sid PK, FK
         string side_id PK, FK
         int berries_available
         int berries_collected
         int goldenstrawberry_achieved
         int goldenwingstrawberry_achieved
     }

     ChapterSideRooms ||--o{ GameSessionChapterRoomStats : "source"
     ChapterSideRooms {
         string chapter_sid PK, FK
         string side_id PK, FK
         string name PK
         int order
         int strawberries_available
     }

     GameSessions ||--o{ GameSessionChapterRoomStats : "logs"
     GameSessions {
         string id PK
         string chapter_sid FK
         string side_id FK
         string date_time_start
         int duration_ms
         int is_goldenberry_attempt
         int is_goldenberry_completed
     }

     GameSessionChapterRoomStats {
         int id PK
         string gamesession_id FK
         string chapter_sid FK
         string side_id FK
         string room_name FK
         int deaths_in_room
         int dashes_in_room
         int jumps_in_room
         int strawberries_achieved_in_room
         int hearts_achieved_in_room
     }
