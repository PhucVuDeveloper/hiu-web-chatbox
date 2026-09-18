/**
 * HIUDatabase - Hệ thống Cơ sở dữ liệu quản lý Phiếu tiếp nhận hỗ trợ HIU
 * Sử dụng IndexedDB với cơ chế đồng bộ dự phòng LocalStorage (Dual-layer persistence).
 * Cung cấp đầy đủ các thao tác: Khởi tạo, Ghi nhận phiếu, Xoá phiếu, Truy vấn phiếu, Xuất dữ liệu.
 */

(function(window) {
  'use strict';

  const DB_NAME = 'HIU_Support_DB';
  const DB_VERSION = 1;
  const STORE_NAME = 'support_tickets';
  const LOCAL_STORAGE_KEY = 'hiu_support_tickets';

  class TicketDatabase {
    constructor() {
      this.db = null;
      this.isIndexedDBReady = false;
      this.listeners = {};
      this._initPromise = this.init();
    }

    /**
     * Khởi tạo IndexedDB và đồng bộ dữ liệu ban đầu
     */
    async init() {
      if (!('indexedDB' in window)) {
        console.warn('[HIUDatabase] Trình duyệt không hỗ trợ IndexedDB. Sử dụng LocalStorage.');
        this.isIndexedDBReady = false;
        return null;
      }

      return new Promise((resolve) => {
        let isSettled = false;
        const settle = (res) => {
          if (!isSettled) {
            isSettled = true;
            resolve(res);
          }
        };

        const timeout = setTimeout(() => {
          console.warn('[HIUDatabase] Quá thời gian mở IndexedDB. Tiếp tục với LocalStorage.');
          settle(null);
        }, 1500);

        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, { keyPath: 'ticketId' });
              store.createIndex('studentId', 'studentId', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('issueType', 'issueType', { unique: false });
            }
          };

          request.onsuccess = (event) => {
            clearTimeout(timeout);
            this.db = event.target.result;
            this.isIndexedDBReady = true;
            console.log('[HIUDatabase] Kết nối IndexedDB thành công:', DB_NAME);
            this._syncFromLocalStorageToIndexedDB();
            settle(this.db);
          };

          request.onerror = (event) => {
            clearTimeout(timeout);
            console.warn('[HIUDatabase] Lỗi mở IndexedDB:', event.target.error);
            this.isIndexedDBReady = false;
            settle(null);
          };

          request.onblocked = () => {
            clearTimeout(timeout);
            console.warn('[HIUDatabase] IndexedDB bị blocked.');
            settle(null);
          };
        } catch (e) {
          clearTimeout(timeout);
          console.warn('[HIUDatabase] Ngoại lệ khi mở IndexedDB:', e);
          this.isIndexedDBReady = false;
          settle(null);
        }
      });
    }

    /**
     * Đợi cơ sở dữ liệu sẵn sàng trước khi thực thi truy vấn
     */
    async ready() {
      if (this._initPromise) {
        await this._initPromise;
      }
      return this;
    }

    // ==============================================================
    // 1. GHI NHẬN PHIẾU VÀO CƠ SỞ DỮ LIỆU (RECORD / SAVE TICKET)
    // ==============================================================
    /**
     * Ghi nhận phiếu mới hoặc cập nhật phiếu đã tồn tại
     * @param {Object} ticket Thông tin phiếu tiếp nhận hỗ trợ
     * @returns {Promise<Object>} Phiếu đã được lưu
     */
    async recordTicket(ticket) {
      await this.ready();

      if (!ticket || !ticket.ticketId) {
        throw new Error('[HIUDatabase] Dữ liệu phiếu không hợp lệ (thiếu ticketId).');
      }

      // Đảm bảo các trường tiêu chuẩn
      const standardizedTicket = {
        ticketId: ticket.ticketId,
        fullName: ticket.fullName || '',
        studentId: ticket.studentId || '',
        majorClass: ticket.majorClass || '',
        studentEmail: ticket.studentEmail || '',
        personalEmail: ticket.personalEmail || '',
        phone: ticket.phone || '',
        issueType: ticket.issueType || '',
        issueLabel: ticket.issueLabel || ticket.topic || 'Hỗ trợ CNTT',
        question: ticket.question || '',
        hasImage: !!ticket.hasImage || (ticket.images && ticket.images.length > 0),
        imageName: ticket.imageName || '',
        imageUrl: ticket.imageUrl || '',
        images: ticket.images || (ticket.imageUrl ? [{ dataUrl: ticket.imageUrl, name: ticket.imageName || 'Hình ảnh sự cố' }] : []),
        hasVideo: !!ticket.hasVideo || (ticket.videos && ticket.videos.length > 0),
        videoName: ticket.videoName || '',
        videoUrl: ticket.videoUrl || '',
        videos: ticket.videos || (ticket.videoUrl ? [{ dataUrl: ticket.videoUrl, name: ticket.videoName || 'Video sự cố' }] : []),
        department: ticket.department || 'Phòng Công nghệ thông tin HIU',
        status: ticket.status || 'Đã tiếp nhận',
        createdAt: ticket.createdAt || new Date().toLocaleString('vi-VN'),
        timestamp: ticket.timestamp || Date.now()
      };

      // 1. Lưu vào LocalStorage (lớp dự phòng tức thì)
      this._saveToLocalStorage(standardizedTicket);

      // 2. Lưu vào IndexedDB
      if (this.isIndexedDBReady && this.db) {
        await new Promise((resolve, reject) => {
          try {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(standardizedTicket);

            req.onsuccess = () => resolve(standardizedTicket);
            req.onerror = (err) => {
              console.warn('[HIUDatabase] Lỗi khi lưu vào IndexedDB:', err);
              resolve(standardizedTicket); // Vẫn resolve vì đã lưu vào LocalStorage
            };
          } catch (err) {
            console.warn('[HIUDatabase] Ngoại lệ khi ghi IndexedDB:', err);
            resolve(standardizedTicket);
          }
        });
      }

      // Phát sự kiện cập nhật
      this._emit('ticket:recorded', standardizedTicket);
      return standardizedTicket;
    }

    // Alias cho recordTicket
    async saveTicket(ticket) {
      return this.recordTicket(ticket);
    }

    // ==============================================================
    // 2. XOÁ PHIẾU KHỎI CƠ SỞ DỮ LIỆU (DELETE TICKET)
    // ==============================================================
    /**
     * Xoá phiếu hỗ trợ vĩnh viễn khỏi cả IndexedDB và LocalStorage
     * @param {string} ticketId Mã phiếu cần xoá (VD: "HIU-IT-123456")
     * @returns {Promise<boolean>} true nếu xoá thành công
     */
    async deleteTicket(ticketId) {
      await this.ready();

      if (!ticketId) {
        console.warn('[HIUDatabase] Không có ticketId để xoá.');
        return false;
      }

      // 1. Xoá khỏi LocalStorage
      const localSuccess = this._deleteFromLocalStorage(ticketId);

      // 2. Xoá khỏi IndexedDB
      let idbSuccess = false;
      if (this.isIndexedDBReady && this.db) {
        idbSuccess = await new Promise((resolve) => {
          try {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(ticketId);

            req.onsuccess = () => resolve(true);
            req.onerror = (err) => {
              console.warn('[HIUDatabase] Lỗi xoá từ IndexedDB:', err);
              resolve(false);
            };
          } catch (e) {
            console.warn('[HIUDatabase] Ngoại lệ khi xoá IndexedDB:', e);
            resolve(false);
          }
        });
      }

      // Phát sự kiện đã xoá phiếu
      this._emit('ticket:deleted', { ticketId: ticketId });
      console.log('[HIUDatabase] Đã xoá phiếu #' + ticketId + ' khỏi cơ sở dữ liệu.');
      return localSuccess || idbSuccess;
    }

    // ==============================================================
    // 3. TRUY VẤN VÀ LẤY DỮ LIỆU PHIẾU (QUERIES)
    // ==============================================================
    /**
     * Lấy toàn bộ danh sách phiếu đã ghi nhận trong cơ sở dữ liệu
     * Sắp xếp theo thứ tự mới nhất lên đầu
     * @returns {Promise<Array>}
     */
    async getAllTickets() {
      await this.ready();

      if (this.isIndexedDBReady && this.db) {
        try {
          const tickets = await new Promise((resolve) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();

            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
          });

          if (tickets && tickets.length > 0) {
            // Sắp xếp mới nhất lên đầu
            return tickets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          }
        } catch (e) {
          console.warn('[HIUDatabase] Ngoại lệ getAllTickets IndexedDB:', e);
        }
      }

      // Fallback về LocalStorage
      return this._getFromLocalStorage();
    }

    /**
     * Lấy chi tiết một phiếu hỗ trợ theo mã phiếu
     * @param {string} ticketId
     * @returns {Promise<Object|null>}
     */
    async getTicket(ticketId) {
      await this.ready();

      if (this.isIndexedDBReady && this.db) {
        try {
          const ticket = await new Promise((resolve) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(ticketId);

            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          });
          if (ticket) return ticket;
        } catch (e) {
          console.warn('[HIUDatabase] Ngoại lệ getTicket IndexedDB:', e);
        }
      }

      const list = this._getFromLocalStorage();
      return list.find(t => t.ticketId === ticketId) || null;
    }

    /**
     * Tìm phiếu theo Mã số sinh viên (MSSV)
     * @param {string} studentId
     * @returns {Promise<Array>}
     */
    async getTicketsByStudent(studentId) {
      const all = await this.getAllTickets();
      if (!studentId) return all;
      const cleanMssv = studentId.trim().toLowerCase();
      return all.filter(t => t.studentId && t.studentId.trim().toLowerCase() === cleanMssv);
    }

    /**
     * Xoá toàn bộ phiếu (reset CSDL)
     * @returns {Promise<boolean>}
     */
    async clearAllTickets() {
      await this.ready();
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}

      if (this.isIndexedDBReady && this.db) {
        await new Promise((resolve) => {
          try {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onsuccess = () => resolve(true);
            req.onerror = () => resolve(false);
          } catch (e) {
            resolve(false);
          }
        });
      }

      this._emit('database:cleared', {});
      return true;
    }

    /**
     * Đếm tổng số lượng phiếu đang được lưu
     * @returns {Promise<number>}
     */
    async countTickets() {
      const list = await this.getAllTickets();
      return list.length;
    }

    /**
     * Xuất dữ liệu CSDL dưới dạng chuỗi JSON
     * @returns {Promise<string>}
     */
    async exportJSON() {
      const list = await this.getAllTickets();
      return JSON.stringify(list, null, 2);
    }

    // ==============================================================
    // 4. CƠ CHẾ ĐỒNG BỘ LOCALSTORAGE
    // ==============================================================
    _getFromLocalStorage() {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }

    _saveToLocalStorage(ticket) {
      try {
        const list = this._getFromLocalStorage();
        const existingIndex = list.findIndex(t => t.ticketId === ticket.ticketId);
        if (existingIndex >= 0) {
          list[existingIndex] = ticket;
        } else {
          list.unshift(ticket);
        }
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('[HIUDatabase] Lỗi ghi LocalStorage:', e);
      }
    }

    _deleteFromLocalStorage(ticketId) {
      try {
        const list = this._getFromLocalStorage();
        const updated = list.filter(t => t.ticketId !== ticketId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return true;
      } catch (e) {
        console.warn('[HIUDatabase] Lỗi xoá LocalStorage:', e);
        return false;
      }
    }

    async _syncFromLocalStorageToIndexedDB() {
      try {
        const localList = this._getFromLocalStorage();
        if (localList.length === 0 || !this.db) return;

        const tx = this.db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const item of localList) {
          if (item && item.ticketId) {
            store.put(item);
          }
        }
      } catch (e) {
        console.warn('[HIUDatabase] Lỗi đồng bộ LocalStorage -> IndexedDB:', e);
      }
    }

    // ==============================================================
    // 5. EVENT EMITTER CHO GIAO DIỆN
    // ==============================================================
    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    }

    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    _emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try {
            cb(data);
          } catch (e) {
            console.error('[HIUDatabase] Lỗi callback sự kiện:', e);
          }
        });
      }
      // Phát cả CustomEvent cho DOM
      window.dispatchEvent(new CustomEvent('hiudb:' + event, { detail: data }));
    }
  }

  // Khởi tạo Singleton Database Instance
  window.HIUDatabase = new TicketDatabase();

})(window);
