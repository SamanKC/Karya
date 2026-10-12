-- Karya MVP initial migration
-- Generated manually from schema.prisma (Prisma engine binaries unavailable in build environment)

-- ─── Users ───────────────────────────────────────────────

CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `timezone` VARCHAR(100) NOT NULL DEFAULT 'UTC',
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `idx_users_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Projects ────────────────────────────────────────────

CREATE TABLE `projects` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(50) NOT NULL DEFAULT 'charcoal',
    `parent_id` CHAR(36) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `view_style` VARCHAR(10) NOT NULL DEFAULT 'list',
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `is_inbox` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_projects_user`(`user_id`),
    INDEX `idx_projects_user_favorite`(`user_id`, `is_favorite`),
    INDEX `idx_projects_parent`(`parent_id`),
    FULLTEXT INDEX `idx_projects_search`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Sections ────────────────────────────────────────────

CREATE TABLE `sections` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `is_collapsed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_sections_project`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Tasks ───────────────────────────────────────────────

CREATE TABLE `tasks` (
    `id` CHAR(36) NOT NULL,
    `project_id` CHAR(36) NOT NULL,
    `section_id` CHAR(36) NULL,
    `parent_id` CHAR(36) NULL,
    `content` VARCHAR(2000) NOT NULL,
    `description` TEXT NULL,
    `priority` TINYINT NOT NULL DEFAULT 1,
    `due_date` DATE NULL,
    `due_datetime` DATETIME(0) NULL,
    `due_timezone` VARCHAR(100) NULL,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(3) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `creator_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_tasks_project`(`project_id`),
    INDEX `idx_tasks_section`(`section_id`),
    INDEX `idx_tasks_parent`(`parent_id`),
    INDEX `idx_tasks_creator`(`creator_id`),
    INDEX `idx_tasks_active`(`project_id`, `is_completed`),
    INDEX `idx_tasks_due_date`(`due_date`, `is_completed`),
    INDEX `idx_tasks_due_datetime`(`due_datetime`, `is_completed`),
    FULLTEXT INDEX `idx_tasks_search`(`content`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Labels ──────────────────────────────────────────────

CREATE TABLE `labels` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(50) NOT NULL DEFAULT 'charcoal',
    `order` INTEGER NOT NULL DEFAULT 0,
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_labels_user`(`user_id`),
    UNIQUE INDEX `idx_labels_user_name`(`user_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Task Labels (join table) ────────────────────────────

CREATE TABLE `task_labels` (
    `task_id` CHAR(36) NOT NULL,
    `label_id` CHAR(36) NOT NULL,

    INDEX `idx_task_labels_label`(`label_id`),
    PRIMARY KEY (`task_id`, `label_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Refresh Tokens ──────────────────────────────────────

CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `idx_refresh_tokens_hash`(`token_hash`),
    INDEX `idx_refresh_tokens_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Foreign Keys ────────────────────────────────────────

ALTER TABLE `projects` ADD CONSTRAINT `projects_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `projects` ADD CONSTRAINT `projects_parent_id_fkey`
    FOREIGN KEY (`parent_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `sections` ADD CONSTRAINT `sections_project_id_fkey`
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `tasks` ADD CONSTRAINT `tasks_project_id_fkey`
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `tasks` ADD CONSTRAINT `tasks_section_id_fkey`
    FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `tasks` ADD CONSTRAINT `tasks_parent_id_fkey`
    FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `tasks` ADD CONSTRAINT `tasks_creator_id_fkey`
    FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `labels` ADD CONSTRAINT `labels_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `task_labels` ADD CONSTRAINT `task_labels_task_id_fkey`
    FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `task_labels` ADD CONSTRAINT `task_labels_label_id_fkey`
    FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
