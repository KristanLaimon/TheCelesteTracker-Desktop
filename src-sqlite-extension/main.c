#ifdef _MSC_VER
#define _CRT_SECURE_NO_WARNINGS
#endif

#ifndef _GNU_SOURCE
#define _GNU_SOURCE
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "dependencies/sqlite3/sqlite3.h"
#include "dependencies/cjson/cJSON.h"
#include "dependencies/mongoose/mongoose.h"

// Variables globales para Neutralino
char nl_port[32];
char nl_token[256];
char nl_ext_id[256];
char nl_connect_token[256];
bool keep_running = true;

// Función principal de SQLite 
char* execute_sqlite_query(const char* db_path, const char* sql) {
    sqlite3 *db;
    sqlite3_stmt *stmt;
    cJSON *root = cJSON_CreateObject();
    cJSON *rows = cJSON_CreateArray();
    char *json_result = NULL;

    if (sqlite3_open(db_path, &db) != SQLITE_OK) {
        cJSON_AddBoolToObject(root, "success", 0);
        cJSON_AddStringToObject(root, "error", sqlite3_errmsg(db));
        json_result = cJSON_PrintUnformatted(root);
        cJSON_Delete(root);
        return json_result;
    }

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        cJSON_AddBoolToObject(root, "success", 0);
        cJSON_AddStringToObject(root, "error", sqlite3_errmsg(db));
        sqlite3_close(db);
        json_result = cJSON_PrintUnformatted(root);
        cJSON_Delete(root);
        return json_result;
    }

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *row = cJSON_CreateObject();
        int cols = sqlite3_column_count(stmt);
        
        for (int i = 0; i < cols; i++) {
            const char *col_name = sqlite3_column_name(stmt, i);
            int col_type = sqlite3_column_type(stmt, i);
            
            switch (col_type) {
                case SQLITE_INTEGER:
                    cJSON_AddNumberToObject(row, col_name, (double)sqlite3_column_int64(stmt, i));
                    break;
                case SQLITE_FLOAT:
                    cJSON_AddNumberToObject(row, col_name, sqlite3_column_double(stmt, i));
                    break;
                case SQLITE_TEXT:
                    cJSON_AddStringToObject(row, col_name, (const char*)sqlite3_column_text(stmt, i));
                    break;
                case SQLITE_NULL:
                default:
                    cJSON_AddNullToObject(row, col_name);
                    break;
            }
        }
        cJSON_AddItemToArray(rows, row);
    }

    cJSON_AddBoolToObject(root, "success", 1);
    cJSON_AddItemToObject(root, "rows", rows);
    cJSON_AddNumberToObject(root, "changes", (double)sqlite3_changes(db));
    cJSON_AddNumberToObject(root, "lastInsertRowId", (double)sqlite3_last_insert_rowid(db));

    sqlite3_finalize(stmt);
    sqlite3_close(db);

    json_result = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    return json_result;
}

// Callback de Mongoose para manejar eventos del WebSocket
static void fn(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_WS_OPEN) {
        printf("[%s] INFO: Conectado a NeutralinoJS via Mongoose\n", nl_ext_id);
    } 
    else if (ev == MG_EV_WS_MSG) {
        struct mg_ws_message *wm = (struct mg_ws_message *) ev_data;
        
        // Crear un string terminado en null para cJSON
        char *msg_str = malloc(wm->data.len + 1);
        memcpy(msg_str, wm->data.buf, wm->data.len);
        msg_str[wm->data.len] = '\0';

        cJSON *msg = cJSON_Parse(msg_str);
        free(msg_str);

        if (msg) {
            cJSON *event = cJSON_GetObjectItem(msg, "event");
            cJSON *data = cJSON_GetObjectItem(msg, "data");

            if (event && strcmp(event->valuestring, "executeSql") == 0 && data) {
                cJSON *db_path = cJSON_GetObjectItem(data, "db");
                cJSON *sql = cJSON_GetObjectItem(data, "sql");

                if (db_path && sql) {
                    char *sql_result = execute_sqlite_query(db_path->valuestring, sql->valuestring);

                    cJSON *response = cJSON_CreateObject();
                    cJSON_AddStringToObject(response, "id", "uuid-placeholder"); 
                    cJSON_AddStringToObject(response, "method", "app.broadcast");
                    cJSON_AddStringToObject(response, "accessToken", nl_token);
                    
                    cJSON *res_data = cJSON_CreateObject();
                    cJSON_AddStringToObject(res_data, "event", "sqlResult");
                    cJSON_AddRawToObject(res_data, "data", sql_result); 
                    
                    cJSON_AddItemToObject(response, "data", res_data);

                    char *out_msg = cJSON_PrintUnformatted(response);
                    
                    // Enviar respuesta por WebSocket usando Mongoose
                    mg_ws_send(c, out_msg, strlen(out_msg), WEBSOCKET_OP_TEXT);
                    
                    free(sql_result);
                    free(out_msg);
                    cJSON_Delete(response);
                }
            }
            cJSON_Delete(msg);
        }
    } 
    else if (ev == MG_EV_ERROR || ev == MG_EV_CLOSE) {
        printf("[%s] INFO: Conexion cerrada o error. Saliendo...\n", nl_ext_id);
        keep_running = false; // Rompe el bucle principal
    }
}

int main() {
    // 1. Leer parámetros de Neutralino
    char stdin_buf[1024];
    if (fgets(stdin_buf, sizeof(stdin_buf), stdin) == NULL) {
        fprintf(stderr, "Error leyendo stdin\n");
        return 1;
    }

    cJSON *config = cJSON_Parse(stdin_buf);
    if (!config) {
        fprintf(stderr, "JSON invalido\n");
        return 1;
    }

    strcpy(nl_port, cJSON_GetObjectItem(config, "nlPort")->valuestring);
    strcpy(nl_token, cJSON_GetObjectItem(config, "nlToken")->valuestring);
    strcpy(nl_ext_id, cJSON_GetObjectItem(config, "nlExtensionId")->valuestring);
    strcpy(nl_connect_token, cJSON_GetObjectItem(config, "nlConnectToken")->valuestring);
    cJSON_Delete(config);

    // 2. Inicializar Mongoose
    struct mg_mgr mgr;
    mg_mgr_init(&mgr);

    // 3. Construir URL de conexión
    char ws_url[1024];
    snprintf(ws_url, sizeof(ws_url), "ws://localhost:%s/?extensionId=%s&connectToken=%s", 
             nl_port, nl_ext_id, nl_connect_token);

    // 4. Conectar
    mg_ws_connect(&mgr, ws_url, fn, NULL, NULL);

    // 5. Bucle de eventos
    while (keep_running) {
        mg_mgr_poll(&mgr, 1000);
    }

    mg_mgr_free(&mgr);
    return 0;
}