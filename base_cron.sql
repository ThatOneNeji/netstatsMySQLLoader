DROP TABLE `tbl_base_cron`;

CREATE TABLE `tbl_base_cron`
(
   `rdate`         datetime(3) NOT NULL COMMENT 'Record time',
   `stime`         datetime(3) NOT NULL COMMENT 'Start time',
   `rectime`       datetime(3) NOT NULL COMMENT 'Rec time',
   `etime`         datetime(3) NOT NULL COMMENT 'End time',
   `area`          varchar(32) DEFAULT NULL,
   `protocol`      varchar(32) DEFAULT NULL,
   `host`          varchar(32) DEFAULT NULL,
   `minterval`     varchar(32) DEFAULT NULL,
   `parameters`    varchar(32) DEFAULT NULL,
   `groupname`     varchar(32) DEFAULT NULL,
   `content`       varchar(32) DEFAULT NULL,
   `status`        varchar(32) DEFAULT NULL,
   `hostname`      varchar(20) DEFAULT NULL,
   `caid`          varchar(64) NOT NULL,
   `processed`     varchar(1) DEFAULT 'n',
   `ldate`         datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Load date',
   PRIMARY KEY(`rdate`, `caid`),
   KEY `rdate_target_status_idx` (`rdate`, `content`, `status`),
   KEY `ldate_processed_idx` (`ldate`, `processed`)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8;