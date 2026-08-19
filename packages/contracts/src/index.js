"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./auth/auth.contract"), exports);
__exportStar(require("./billing/billing.contract"), exports);
__exportStar(require("./commercial/commercial.contract"), exports);
__exportStar(require("./inventory/inventory.contract"), exports);
__exportStar(require("./mess/mess.contract"), exports);
__exportStar(require("./pagination/pagination.contract"), exports);
__exportStar(require("./resident/resident.contract"), exports);
__exportStar(require("./tenant/tenant.contract"), exports);
__exportStar(require("./reporting/reporting.contract"), exports);
__exportStar(require("./notifications/notification.contract"), exports);
__exportStar(require("./task/task.contract"), exports);
__exportStar(require("./response/api-response.contract"), exports);
__exportStar(require("./response/api-error.contract"), exports);
//# sourceMappingURL=index.js.map