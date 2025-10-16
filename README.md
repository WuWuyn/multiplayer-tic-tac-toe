# Odd/Even Tic-Tac-Toe

Đây là một dự án game multiplayer online được xây dựng bằng React cho phần client và Node.js với WebSocket cho phần server. Trò chơi là một biến thể độc đáo của Tic-Tac-Toe trên bàn cờ 5x5, nơi người chơi không theo lượt mà có thể nhấp chuột tự do để tăng giá trị của các ô.

## ✨ Tính năng

* **Lối chơi thời gian thực:** Trải nghiệm game nhanh, không theo lượt truyền thống.
* **Tạo và tham gia phòng:** Dễ dàng tạo phòng chơi riêng và mời bạn bè tham gia qua ID phòng.
* **Giao diện hiện đại:** Giao diện người dùng được thiết kế đẹp mắt và thân thiện.
* **Luật chơi sáng tạo:** Mục tiêu là tạo ra một hàng, cột hoặc đường chéo gồm 5 số chẵn hoặc 5 số lẻ.

## 🚀 Cài đặt và Khởi chạy

Dự án bao gồm hai phần chính: **Server** và **Client**. Bạn cần chạy cả hai để có thể chơi game.

### 1. Cài đặt Server

```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt các thư viện cần thiết
npm install

# Khởi động server
node server.js
````

Server sẽ chạy trên cổng `8080`.

### 2\. Cài đặt Client

```bash
# Mở một cửa sổ dòng lệnh mới và di chuyển vào thư mục client (thư mục gốc của dự án React)
# Giả sử thư mục client của bạn là thư mục gốc chứa `src`
npm install

# Khởi chạy client
npm run dev
```

Ứng dụng React sẽ khởi động và tự động mở trong trình duyệt của bạn.

## 🎮 Luật chơi

  * **Bàn cờ:** 5x5, tất cả các ô bắt đầu từ 0.
  * **Người chơi:** Người tạo phòng là **Phe LẺ**, người tham gia là **Phe CHẴN**.
  * **Cách chơi:**
      * Nhấp vào ô bất kỳ để tăng giá trị của nó lên 1 (0 → 1 → 2...).
      * Cả hai người chơi có thể nhấp chuột bất cứ lúc nào (không theo lượt\!).
  * **Chiến thắng:**
      * **Phe LẺ thắng** nếu có một hàng, cột, hoặc đường chéo bất kỳ chứa đủ 5 số LẺ.
      * **Phe CHẴN thắng** nếu có một hàng, cột, hoặc đường chéo bất kỳ chứa đủ 5 số CHẴN.

<!-- end list -->

````

***

### 📄 server/README.md (Dành riêng cho Server)

```markdown
# Server Game Odd/Even Tic-Tac-Toe

Đây là server backend cho dự án game Odd/Even Tic-Tac-Toe, được xây dựng bằng Node.js và thư viện `ws` để quản lý kết nối WebSocket.

## 📜 Mô tả

Server xử lý các tác vụ sau:
* Tạo và quản lý các phòng chơi.
* Xử lý logic kết nối và ngắt kết nối của người chơi.
* Nhận và xử lý các hành động trong game (như tăng giá trị ô).
* Kiểm tra điều kiện chiến thắng và thông báo cho người chơi.
* Đồng bộ hóa trạng thái game giữa hai người chơi trong một phòng.

## 🛠️ Cài đặt

1.  **Yêu cầu:** Cần có [Node.js](https://nodejs.org/) được cài đặt trên máy của bạn.

2.  **Cài đặt thư viện:** Từ thư mục `server`, chạy lệnh sau để cài đặt các thư viện cần thiết được định nghĩa trong `package.json`:
    ```bash
    npm install
    ```

## ▶️ Khởi chạy

Để khởi động server, chạy lệnh sau trong thư mục `server`:

```bash
node server.js
````

Server sẽ lắng nghe các kết nối WebSocket trên cổng `8080`.

## 📦 Thư viện chính

  * [**ws**](https://github.com/websockets/ws): Thư viện WebSocket cho Node.js, dùng để xử lý giao tiếp thời gian thực với client.
  * [**uuid**](https://github.com/uuidjs/uuid): Dùng để tạo ID phòng duy nhất cho mỗi phòng chơi.

<!-- end list -->

````

***

### 📄 client/README.md (Dành riêng cho Client)

*Lưu ý: Giả sử thư mục client là thư mục gốc chứa `package.json` và thư mục `src`.*

```markdown
# Client Game Odd/Even Tic-Tac-Toe

Đây là client frontend cho dự án game Odd/Even Tic-Tac-Toe, được xây dựng bằng React và Vite.

## 📜 Mô tả

Client cung cấp giao diện người dùng để người chơi có thể:
* Nhập tên và tạo phòng chơi mới.
* Tham gia vào một phòng chơi đã có bằng ID.
* Tương tác với bàn cờ trong thời gian thực.
* Xem trạng thái trận đấu, thông tin người chơi và kết quả.
* Yêu cầu chơi lại sau khi trận đấu kết thúc.

## 🛠️ Cài đặt

1.  **Yêu cầu:** Cần có [Node.js](https://nodejs.org/) và `npm` được cài đặt trên máy của bạn.

2.  **Cài đặt thư viện:** Từ thư mục gốc của client, chạy lệnh sau để cài đặt các thư viện cần thiết:
    ```bash
    npm install
    ```

## ▶️ Khởi chạy

Để khởi động client ở chế độ phát triển, chạy lệnh sau:

```bash
npm run dev
````

Vite sẽ khởi động một server phát triển và mở ứng dụng trong trình duyệt của bạn, thường là tại địa chỉ `http://localhost:5173`.

## 📦 Thư viện chính

  * **React:** Thư viện JavaScript để xây dựng giao diện người dùng.
  * **Vite:** Công cụ xây dựng và phát triển frontend hiện đại.

<!-- end list -->
