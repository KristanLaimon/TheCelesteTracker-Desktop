pub enum OS {
    Windows,
    MacOS,
    LinuxBased,
}

impl OS {
    pub fn to_str(&self) -> &'static str {
        match self {
            OS::Windows => "windows",
            OS::MacOS => "macos",
            OS::LinuxBased => "linux",
        }
    }

    pub fn to_string(&self) -> String {
        match self {
            OS::Windows => String::from("windows"),
            OS::MacOS => String::from("macos"),
            OS::LinuxBased => String::from("linux"),
        }
    }
}

pub fn get_current_os() -> OS {
    #[cfg(target_os = "windows")]
    {
        return OS::Windows;
    }
    #[cfg(target_os = "linux")]
    {
        return OS::LinuxBased;
    }
    #[cfg(target_os = "macos")]
    {
        return OS::MacOS;
    }
}
