CREATE TABLE `tbl_base_nslookup01`
(
   `rdate`           datetime NOT NULL COMMENT 'Row date',
   `starttime`       datetime(3) NOT NULL COMMENT 'Start time',
   `endtime`         datetime(3) NOT NULL COMMENT 'End time',
   `duration`        int(11)
                     DEFAULT NULL
                     COMMENT 'Time taken to complete the request',
   `platform`        varchar(32) NOT NULL,
   `server`          varchar(16) NOT NULL,
   `address`         varchar(32) NOT NULL,
   `addresses`       varchar(512) NOT NULL,
   `dnsTimeTaken`    varchar(16) NOT NULL,
   `status`          varchar(16) DEFAULT 'success',
   `rawdata`         varchar(4000) DEFAULT NULL,
   `caid`            varchar(64) NOT NULL,
   `processed`       varchar(1) DEFAULT 'n',
   `ldate`           datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'Load date',
   PRIMARY KEY(`rdate`, `caid`),
   KEY `rdate_target_status_idx_01` (`rdate`, `server`, `status`),
   KEY `ldate_processed_idx_01` (`ldate`, `processed`)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8;