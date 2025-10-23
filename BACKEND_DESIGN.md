# 猪舍物联网环境监控与预警系统 - 后端设计说明书

## 1. 高层概览 (High-Level Overview)

- **目标**: 为前端应用提供一个稳定、可扩展、安全的后端服务。后端将全权负责业务逻辑、数据持久化、实时数据模拟和用户认证。
- **技术栈**:
    - **框架**: Spring Boot 3+ (利用其快速开发、自动配置的特性)
    - **数据库交互**: MyBatis-Plus (简化CRUD操作，同时保留XML编写复杂SQL的灵活性)
    - **数据库**: MySQL 8.0+ (或 PostgreSQL 12+)
    - **认证**: Spring Security + JWT (JSON Web Tokens) (实现无状态、可扩展的API认证)
    - **依赖管理**: Maven 或 Gradle

## 2. 数据库设计 (Database Schema)

这是系统的基石。所有数据都将持久化到关系型数据库中。

**`users` (用户表)**
- **用途**: 存储技术员信息。管理员角色可以硬编码或存入此表。
```sql
CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'technician' -- e.g., 'admin', 'technician'
  -- 如果需要登录功能，增加 username 和 password 字段
  -- `username` VARCHAR(255) NOT NULL UNIQUE,
  -- `password` VARCHAR(255) NOT NULL -- 存储哈希后的密码
);
```

**`pigsties` (猪舍表)**
- **用途**: 存储猪舍的基本信息和其专属的自定义环境阈值。
```sql
CREATE TABLE `pigsties` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL COMMENT '类型, e.g., Farrowing, Nursery',
  `capacity` INT NOT NULL,
  `technician_id` BIGINT NULL COMMENT '外键, 关联 users.id',
  `thresholds` JSON NULL COMMENT '存储自定义阈值的JSON对象',
  FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);
```

**`devices` (设备表)**
- **用途**: 管理每个猪舍下的传感器设备及其状态。
```sql
CREATE TABLE `devices` (
  `id` VARCHAR(255) PRIMARY KEY COMMENT '组合主键, e.g., 1-Temperature',
  `pigsty_id` BIGINT NOT NULL,
  `type` VARCHAR(100) NOT NULL COMMENT '设备类型, e.g., Temperature, Humidity',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (`pigsty_id`) REFERENCES `pigsties`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_pigsty_device_type` (`pigsty_id`, `type`) -- 确保一个猪舍同类型设备唯一
);
```

**`sensor_readings` (传感器读数表)**
- **用途**: 存储历史传感器数据。**这是数据量最大的表**，需要特别考虑性能。
```sql
CREATE TABLE `sensor_readings` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `pigsty_id` BIGINT NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `temperature` DECIMAL(5,2) NULL,
  `humidity` DECIMAL(5,2) NULL,
  `ammonia` DECIMAL(5,2) NULL,
  `light` DECIMAL(5,2) NULL,
  INDEX `idx_pigsty_timestamp` (`pigsty_id`, `timestamp`), -- 为历史查询创建索引
  FOREIGN KEY (`pigsty_id`) REFERENCES `pigsties`(`id`) ON DELETE CASCADE
);
```
- **性能优化建议**: 对于生产环境，建议使用**时序数据库 (Time-Series Database)** 如 InfluxDB 或 TimescaleDB 来存储此表的数据。如果继续使用MySQL，必须实现**数据归档/清理策略** (例如，一个 nightly job 删除30天前的数据)。

**`alerts` (警报表)**
- **用途**: 存储所有触发的警报记录。
```sql
CREATE TABLE `alerts` (
  `id` VARCHAR(255) PRIMARY KEY,
  `pigsty_id` BIGINT NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `metric` VARCHAR(100) NOT NULL,
  `value` DECIMAL(10,2) NOT NULL,
  `level` VARCHAR(50) NOT NULL COMMENT 'e.g., Warning, Danger',
  `message` VARCHAR(255) NOT NULL,
  FOREIGN KEY (`pigsty_id`) REFERENCES `pigsties`(`id`) ON DELETE CASCADE
);
```

## 3. 核心业务逻辑 (Core Business Logic)

**a. 数据模拟与警报生成 (定时任务)**
- **实现**: 使用 Spring Boot 的 `@Scheduled` 注解创建一个定时任务。
- **频率**: `fixedRate = 5000` (每5秒执行一次)。
- **逻辑**:
    1.  查询数据库中所有 `is_active = true` 的设备。
    2.  遍历每个猪舍。
    3.  为该猪舍生成一条新的 `sensor_readings` 记录：
        -   获取最新的读数作为基准。
        -   对每个激活的设备类型，在基准值上增加一个小的随机波动来模拟真实数据。
        -   未激活的设备类型，值为 `NULL`。
    4.  **将新读数存入 `sensor_readings` 表。**
    5.  **警报检查**:
        -   拿着刚生成的新读数，获取其所属猪舍的阈值 (`pigsties.thresholds`)。
        -   如果猪舍没有自定义阈值，则从后端的配置文件 (`application.yml`) 中读取全局默认阈值。
        -   逐一对比新读数的各项指标是否超出“警告”或“危险”阈值。
        -   如果超出，立即向 `alerts` 表插入一条新的警报记录。

**b. 服务层 (Service Layer)**
-   将所有业务逻辑封装在 Service 类中 (e.g., `PigstyService`, `UserService`)。
-   使用 `@Transactional` 注解确保数据操作的原子性。
-   例如，`UserService` 中的 `deleteUser` 方法需要检查该用户是否被分配到任何猪舍，如果是，则抛出业务异常，防止删除。

## 4. API 端点设计 (RESTful API Specification)

这是前后端交互的契约。所有API都应以 `/api/v1` 为前缀。

**统一响应格式**:
```json
{
  "code": 200,
  "message": "Success",
  "data": { ... }
}
```

**a. 初始数据接口**
-   **`GET /api/v1/bootstrap`**
    -   **描述**: 应用启动时，一次性获取所有核心数据，减少HTTP请求次数。
    -   **响应 (200 OK)**:
        ```json
        {
          "users": [...],
          "pigsties": [...],
          "devices": [...],
          "alerts": [...]
        }
        ```
    - **注意**: `pigsties` 对象中应包含其最新的N条 `readings` (e.g., 300条) 以便初始化图表。

**b. 实时更新接口 (用于前端轮询)**
-   **`GET /api/v1/updates?lastAlertTimestamp={timestamp}`**
    -   **描述**: 获取最新的猪舍读数和增量警报。
    -   **响应 (200 OK)**:
        ```json
        {
          "pigsties": [...],
          "newAlerts": [...]
        }
        ```
     - **注意**: `pigsties` 对象中应包含其最新的1条 `reading`。

**c. 各模块 CRUD 接口**

-   **用户管理 (`/api/v1/users`)**
    -   `POST /`: 创建用户 (body: `{ "name": "string" }`) -> `201 Created`
    -   `PUT /{id}`: 更新用户 (body: `{ "name": "string" }`) -> `200 OK`
    -   `DELETE /{id}`: 删除用户 -> `204 No Content`
-   **猪舍管理 (`/api/v1/pigsties`)**
    -   `POST /`: 创建猪舍 (body: `Pigsty` 对象) -> `201 Created`
    -   `PUT /{id}`: 更新猪舍信息 (body: `Pigsty` 对象) -> `200 OK`
    -   `DELETE /{id}`: 删除猪舍 -> `204 No Content`
-   **设备管理 (`/api/v1/devices`)**
    -   `POST /`: 添加设备 (body: `{ "pigstyId": number, "type": "MetricType" }`) -> `201 Created`
    -   `PUT /{id}/status`: 切换设备状态 (body: `{ "isActive": boolean }`) -> `200 OK`

**d. 数据查询接口**
-   **`GET /api/v1/alerts/query?startDate=...&endDate=...`**
    -   **描述**: 按日期范围查询警报记录。
-   **`GET /api/v1/pigsties/{id}/readings/query?startDate=...&endDate=...`**
    -   **描述**: 按日期范围查询指定猪舍的历史传感器读数 (用于图表)。后端应进行**数据抽样**，避免返回过多数据点导致前端卡顿。

## 5. 认证与授权 (Authentication & Authorization)

-   **策略**: 使用 Spring Security 和 JWT。
-   **认证流程**:
    1.  前端发送用户名密码到 `POST /api/auth/login`。
    2.  后端验证成功后，生成一个包含 `userId` 和 `role` 的 JWT，返回给前端。
    3.  前端将此 JWT 存储起来 (e.g., localStorage)，并在之后的所有请求的 `Authorization` header 中携带 (`Bearer <token>`)。
-   **授权**:
    -   配置 Spring Security 拦截器，保护所有 `/api/v1/*` 路径。
    -   在 Service 层的方法上使用 `@PreAuthorize("hasRole('ADMIN')")` 等注解进行精细的权限控制。
    -   **关键**: 对于技术员 (`technician`) 角色，所有数据查询必须在SQL层面或业务逻辑中加入 `WHERE technician_id = ?` 的过滤条件，确保他们只能访问自己负责的猪舍数据。
