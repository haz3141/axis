DELETE FROM `recurrence_rules`
WHERE rowid NOT IN (
	SELECT MIN(rowid)
	FROM `recurrence_rules`
	GROUP BY `task_id`
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recurrence_rules_task_id_unique` ON `recurrence_rules` (`task_id`);
