cmake_minimum_required(VERSION 3.10)

# Nombre del proyecto
project(NeutralinoSqliteExt C)

# Usar el estándar C99 (suficiente para SQLite, cJSON y Mongoose)
set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED True)

# Definir el ejecutable y todos los archivos fuente que se van a compilar
add_executable(ext_bin
    main.c
    dependencies/cjson/cJSON.c
    dependencies/sqlite3/sqlite3.c
    dependencies/mongoose/mongoose.c
)

# Indicarle al compilador dónde buscar los archivos .h (cabeceras)
target_include_directories(ext_bin PRIVATE
    dependencies/cjson
    dependencies/sqlite3
    dependencies/mongoose
)

# Detectar el sistema operativo y enlazar las librerías nativas necesarias
if(WIN32)
    # Windows necesita la librería de sockets nativa
    target_link_libraries(ext_bin ws2_32)
    message(STATUS "Configurado para compilación en Windows")

elseif(APPLE)
    # macOS
    target_link_libraries(ext_bin pthread)
    message(STATUS "Configurado para compilación en macOS")

elseif(UNIX AND NOT APPLE)
    # Linux necesita hilos y carga dinámica para SQLite
    target_link_libraries(ext_bin pthread dl m)
    message(STATUS "Configurado para compilación en Linux")
endif()