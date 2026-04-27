use std::error::Error;
use std::path::PathBuf;

/// Returns the base directory for the Celeste installation, ensuring it exists.
pub fn get_steam_game_path() -> Result<PathBuf, Box<dyn Error>> {
    #[cfg(target_os = "windows")]
    let path = {
        let mut p = PathBuf::from(r"C:\Program Files (x86)");
        // Removed leading '\' so it appends instead of overwriting
        p.push(r"Steam\steamapps\common\Celeste");
        p
    };

    #[cfg(target_os = "linux")]
    let path = {
        let home = std::env::var("HOME")?; // '?' automatically converts env errors
        let mut p = PathBuf::from(home);
        // Removed 'Saves' so this function only returns the base game path
        p.push(".local/share/Steam/steamapps/common/Celeste");
        p
    };

    #[cfg(target_os = "macos")]
    let path = {
        let home = std::env::var("HOME")?;
        let mut p = PathBuf::from(home);
        // Removed 'Saves' so this function only returns the base game path
        p.push("Library/Application Support/Steam/steamapps/common/Celeste");
        p
    };

    // Directory existence ensurement
    if !path.exists() {
        return Err(format!("Game directory not found at: {}", path.display()).into());
    }

    if !path.is_dir() {
        return Err(format!("Path exists but is not a directory: {}", path.display()).into());
    }

    Ok(path)
}

pub fn is_game_installed_through_steam() -> bool {
    match get_steam_game_path() {
        Ok(_) => true,
        Err(_) => false,
    }
}

/// Returns the exact file path to the Celeste Tracker Database.
pub fn get_game_saves_path() -> Result<PathBuf, Box<dyn Error>> {
    // Extract the PathBuf from the Result
    let mut game_path = get_steam_game_path()?;

    // Append the Saves folder and check if it exists
    game_path.push("Saves");
    if !game_path.exists() || !game_path.is_dir() {
        return Err(format!("Saves directory not found at: {}. Possible cause: Celeste is not installed in system through Steam", game_path.display()).into());
    }

    Ok(game_path)
}

pub fn get_game_mod_database_path() -> Result<PathBuf, Box<dyn Error>> {
    let mut game_save_path = get_game_saves_path()?;

    game_save_path.push("TheCelesteTracker_DB.db");
    if !game_save_path.exists() || !game_save_path.is_file() {
        return Err(format!("Expected database created by TheCelesteTrackerMod 'TheCelesteTracker_DB.db' not found in .../Celeste/Saves/ folder!").into());
    }

    Ok(game_save_path)
}

pub fn is_database_mod_initialized() -> bool {
    match get_game_mod_database_path() {
        Ok(_) => true,
        Err(_) => false,
    }
}
