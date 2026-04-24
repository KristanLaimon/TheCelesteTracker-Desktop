use sea_orm::{EntityTrait, QueryFilter, ColumnTrait, Order};
use crate::db::*;
use crate::DB;

#[tauri::command]
pub async fn get_save_slots(user_id: i64) -> Result<Vec<i64>, String> {
    let db = DB!();

    let slots = save_datas::Entity::find()
        .filter(save_datas::Column::UserId.eq(user_id))
        .order_by_asc(save_datas::Column::SlotNumber)
        .all(db)
        .await
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|s| s.slot_number)
        .collect();

    Ok(slots)
}
