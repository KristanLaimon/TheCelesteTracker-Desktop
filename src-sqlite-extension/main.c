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

char nl_port[32];
char nl_token[256];
char nl_ext_id[256];
char nl_connect_token[256];
volatile bool keep_running = true;

#include <stdarg.h>

void write_log(const char *format, ...) {
    const char *log_path = "sqlite_extension.log";
    
    FILE *f = fopen(log_path, "a");
    if (f) {
        va_list args;
        va_start(args, format);
        vfprintf(f, format, args);
        va_end(args);
        fclose(f);
    }
}

void get_json_string(cJSON *obj, const char *key, char *dest, size_t dest_len) {
    cJSON *item = cJSON_GetObjectItem(obj, key);
    if (!item) {
        write_log("[DEBUG] Key '%s' not found in JSON\n", key);
        dest[0] = '\0';
        return;
    }
    if (item->type == cJSON_Number) {
        snprintf(dest, dest_len, "%d", item->valueint);
    } else if (item->valuestring) {
        strncpy(dest, item->valuestring, dest_len - 1);
        dest[dest_len - 1] = '\0';
    } else {
        dest[0] = '\0';
    }
}

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

static void fn(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_WS_OPEN) {
        write_log("[INFO] Connected to NeutralinoJS\n");
    } 
    else if (ev == MG_EV_WS_MSG) {
        struct mg_ws_message *wm = (struct mg_ws_message *) ev_data;
        
        char *msg_str = malloc(wm->data.len + 1);
        memcpy(msg_str, wm->data.buf, wm->data.len);
        msg_str[wm->data.len] = '\0';

        write_log("[DEBUG] WebSocket msg received: %s\n", msg_str);

        cJSON *msg = cJSON_Parse(msg_str);
        free(msg_str);

        if (msg) {
            cJSON *event = cJSON_GetObjectItem(msg, "event");
            cJSON *data = cJSON_GetObjectItem(msg, "data");

            if (event && strcmp(event->valuestring, "appClientDisconnect") == 0) {
                write_log("[INFO] appClientDisconnect received. Exiting...\n");
                keep_running = false;
            }
            else if (event && strcmp(event->valuestring, "executeSql") == 0 && data) {
                cJSON *db_path = cJSON_GetObjectItem(data, "db");
                cJSON *sql = cJSON_GetObjectItem(data, "sql");
                cJSON *req_id = cJSON_GetObjectItem(data, "reqId");

                if (db_path && sql) {
                    write_log("[INFO] Executing query: %s (db: %s)\n", sql->valuestring, db_path->valuestring);
                    char *sql_result = execute_sqlite_query(db_path->valuestring, sql->valuestring);
                    write_log("[DEBUG] Query result size: %zu bytes\n", strlen(sql_result));

                    cJSON *response = cJSON_CreateObject();
                    cJSON_AddStringToObject(response, "id", "uuid-placeholder"); 
                    cJSON_AddStringToObject(response, "method", "app.broadcast");
                    cJSON_AddStringToObject(response, "accessToken", nl_token);
                    
                    cJSON *res_data = cJSON_CreateObject();
                    cJSON_AddStringToObject(res_data, "event", "sqlResult");
                    
                    cJSON *payload = cJSON_CreateObject();
                    if (req_id) {
                        cJSON_AddStringToObject(payload, "reqId", req_id->valuestring);
                    }
                    cJSON_AddRawToObject(payload, "result", sql_result);
                    
                    cJSON_AddItemToObject(res_data, "data", payload);
                    cJSON_AddItemToObject(response, "data", res_data);

                    char *out_msg = cJSON_PrintUnformatted(response);
                    write_log("[DEBUG] Sending response to app\n");
                    
                    mg_ws_send(c, out_msg, strlen(out_msg), WEBSOCKET_OP_TEXT);
                    
                    free(sql_result);
                    free(out_msg);
                    cJSON_Delete(response);
                }
            }
            cJSON_Delete(msg);
        }
    } 
    else if (ev == MG_EV_ERROR) {
        write_log("[ERROR] Connection error encountered\n");
        keep_running = false;
    }
    else if (ev == MG_EV_CLOSE) {
        write_log("[INFO] Connection closed. Exiting...\n");
        keep_running = false;
    }
}


int main() {
    // Make standard streams unbuffered (Thanks windows...)
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    write_log("[INFO] SQLite C extension starting up...\n");

    char stdin_buf[1024];
    int ch;
    int index = 0;
    while (index < sizeof(stdin_buf) - 1) {
        ch = fgetc(stdin);
        if (ch == EOF) {
            break;
        }
        stdin_buf[index++] = ch;
        if (ch == '}') {
            break;
        }
    }
    stdin_buf[index] = '\0';

    if (index == 0) {
        write_log("[ERROR] Failed to read stdin (empty or EOF)\n");
        return 1;
    }

    write_log("[DEBUG] Stdin read: %s\n", stdin_buf);

    cJSON *config = cJSON_Parse(stdin_buf);
    if (!config) {
        write_log("[ERROR] Invalid JSON in stdin\n");
        return 1;
    }

    get_json_string(config, "nlPort", nl_port, sizeof(nl_port));
    get_json_string(config, "nlToken", nl_token, sizeof(nl_token));
    get_json_string(config, "nlExtensionId", nl_ext_id, sizeof(nl_ext_id));
    get_json_string(config, "nlConnectToken", nl_connect_token, sizeof(nl_connect_token));
    cJSON_Delete(config);

    write_log("[DEBUG] Configuration parsed: port=%s, ext_id=%s\n", nl_port, nl_ext_id);


    struct mg_mgr mgr;
    mg_mgr_init(&mgr);

    char ws_url[1024];
    snprintf(ws_url, sizeof(ws_url), "ws://127.0.0.1:%s/?extensionId=%s&connectToken=%s", 
             nl_port, nl_ext_id, nl_connect_token);
    write_log("[INFO] Connecting to Neutralino at: %s\n", ws_url);

    // 4. Conectar
    struct mg_connection *conn = mg_ws_connect(&mgr, ws_url, fn, NULL, NULL);
    if (!conn) {
        write_log("[ERROR] mg_ws_connect returned NULL\n");
        mg_mgr_free(&mgr);
        return 1;
    }

    // 5. Bucle de eventos
    while (keep_running) {
        mg_mgr_poll(&mgr, 100);
    }

    write_log("[INFO] SQLite C extension cleaning up and shutting down...\n");
    mg_mgr_free(&mgr);
    return 0;
}