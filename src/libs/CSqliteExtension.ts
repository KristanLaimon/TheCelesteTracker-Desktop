import { events, extensions } from '@neutralinojs/lib';

// Interfaz para definir la estructura de la respuesta de tu extensión en C
export interface SQLiteResult {
    success: boolean;
    error?: string;
    changes?: number;
    lastInsertRowId?: number;
    rows?: any[];
}

export class SQLiteExtension {
    private extensionId: string;
    private dbPath: string;
    // Un mapa para guardar las promesas en espera, indexadas por su ID
    private pendingRequests: Map<string, { resolve: Function, reject: Function }>;

    constructor(extensionId: string, dbPath: string) {
        this.extensionId = extensionId;
        this.dbPath = dbPath;
        this.pendingRequests = new Map();

        // 1. Escuchar el evento que emite nuestra extensión en C
        events.on('sqlResult', this.handleExtensionMessage.bind(this));
    }

    // 2. Manejador de las respuestas de la extensión
    private handleExtensionMessage(evt: CustomEvent) {
        // Neutralino envuelve la respuesta en evt.detail
        let payload = evt.detail;
        
        // Si el payload viene como string (por cómo lo enviamos desde C), lo parseamos
        if (typeof payload === 'string') {
            payload = JSON.parse(payload);
        }

        const reqId = payload.reqId;
        const result = payload.result; // Los datos del SQL

        // Si existe una promesa esperando este ID, la resolvemos
        if (reqId && this.pendingRequests.has(reqId)) {
            const promise = this.pendingRequests.get(reqId)!;
            
            if (result && result.success) {
                promise.resolve(result);
            } else {
                promise.reject(new Error(result?.error || "Error desconocido en SQLite"));
            }
            
            // Limpiamos el mapa
            this.pendingRequests.delete(reqId);
        }
    }

    // 3. Método público para ejecutar SQL de forma limpia
    public async execute(sql: string): Promise<SQLiteResult> {
        return new Promise(async (resolve, reject) => {
            // Generamos un ID único para esta consulta
            const reqId = crypto.randomUUID();
            
            // Guardamos las funciones resolve/reject en el mapa
            this.pendingRequests.set(reqId, { resolve, reject });

            try {
                // Enviamos el mensaje a la extensión de C
                await extensions.dispatch(this.extensionId, 'executeSql', {
                    reqId: reqId,      // <- ID vital para rastrear la respuesta
                    db: this.dbPath,
                    sql: sql
                });
            } catch (error) {
                this.pendingRequests.delete(reqId);
                reject(error);
            }
        });
    }
}