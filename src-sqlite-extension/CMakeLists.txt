cmake_minimum_required(VERSION 3.10)

project(NeutralinoSqliteExt C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED True)

add_executable(ext_bin
    main.c
    dependencies/cjson/cJSON.c
    dependencies/sqlite3/sqlite3.c
    dependencies/mongoose/mongoose.c
)

target_include_directories(ext_bin PRIVATE
    dependencies/cjson
    dependencies/sqlite3
    dependencies/mongoose
)

if(WIN32)
    target_link_libraries(ext_bin ws2_32)
    message(STATUS "Configurado para compilación en Windows")

elseif(APPLE)
    target_link_libraries(ext_bin pthread)
    message(STATUS "Configurado para compilación en macOS")

elseif(UNIX AND NOT APPLE)
    # Linux necesita hilos y carga dinámica para SQLite
    target_link_libraries(ext_bin pthread dl m)
    message(STATUS "Configurado para compilación en Linux")
endif()