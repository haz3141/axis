CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_profile_name_key_unique` ON `projects` (`profile_id`,`name_key`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_profile_name_key_unique` ON `tags` (`profile_id`,`name_key`);--> statement-breakpoint
CREATE TABLE `task_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_tags_task_id_tag_id_unique` ON `task_tags` (`task_id`,`tag_id`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `project_id` text REFERENCES projects(id);
--> statement-breakpoint
INSERT OR IGNORE INTO `tags` (`id`, `profile_id`, `name`, `name_key`)
SELECT
	lower(hex(randomblob(16))),
	legacy_categories.profile_id,
	legacy_categories.name,
	lower(legacy_categories.name)
FROM (
	SELECT DISTINCT
		`profile_id`,
		trim(
			replace(
				replace(
					replace(
						replace(
							replace(
								replace(
									replace(
										replace(
											replace(`category`, char(9), ' '),
											char(10),
											' '
										),
										char(13),
										' '
									),
									'  ',
									' '
								),
								'  ',
								' '
							),
							'  ',
							' '
						),
						'  ',
						' '
					),
					'  ',
					' '
				),
				'  ',
				' '
			)
		) AS name
	FROM `tasks`
	WHERE `category` IS NOT NULL
		AND trim(`category`) <> ''
) AS legacy_categories;
--> statement-breakpoint
INSERT OR IGNORE INTO `task_tags` (`id`, `task_id`, `tag_id`)
SELECT
	lower(hex(randomblob(16))),
	`tasks`.`id`,
	`tags`.`id`
FROM `tasks`
INNER JOIN `tags`
	ON `tags`.`profile_id` = `tasks`.`profile_id`
	AND `tags`.`name_key` = lower(
		trim(
			replace(
				replace(
					replace(
						replace(
							replace(
								replace(
									replace(
										replace(
											replace(`tasks`.`category`, char(9), ' '),
											char(10),
											' '
										),
										char(13),
										' '
									),
									'  ',
									' '
								),
								'  ',
								' '
							),
							'  ',
							' '
						),
						'  ',
						' '
					),
					'  ',
					' '
				),
				'  ',
				' '
			)
		)
	)
WHERE `tasks`.`category` IS NOT NULL
	AND trim(`tasks`.`category`) <> '';
