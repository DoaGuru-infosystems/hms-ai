/**
 * Array of SQL commands to initialize a new tenant database.
 */
const tenantSchemaQueries = [
  `CREATE TABLE IF NOT EXISTS department (
    department_id int(11) NOT NULL AUTO_INCREMENT,
    dept_code varchar(100) NOT NULL,
    dept_name varchar(150) NOT NULL,
    InActive int(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (department_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS users (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    user_id varchar(15) NOT NULL,
    department int(11) NOT NULL,
    designation int(11) NOT NULL,
    user_role int(11) NOT NULL,
    cType varchar(25) NOT NULL DEFAULT '',
    title int(11) NOT NULL DEFAULT 0,
    lastname varchar(50) NOT NULL,
    firstname varchar(50) NOT NULL,
    middlename varchar(25) NOT NULL DEFAULT '',
    age int(2) NOT NULL DEFAULT 0,
    street varchar(50) NOT NULL DEFAULT '',
    subd_brgy varchar(50) NOT NULL DEFAULT '',
    province char(50) NOT NULL DEFAULT '',
    phone_no varchar(15) NOT NULL DEFAULT '',
    mobile_no varchar(15) NOT NULL DEFAULT '',
    gender int(1) NOT NULL DEFAULT 0,
    civil_status int(1) NOT NULL DEFAULT 0,
    birthday date DEFAULT NULL,
    birthplace varchar(100) NOT NULL DEFAULT '',
    email_address varchar(75) NOT NULL DEFAULT '',
    username varchar(25) NOT NULL,
    password varchar(100) NOT NULL,
    picture varchar(100) NOT NULL DEFAULT '',
    doctorIsIn varchar(10) NOT NULL DEFAULT '',
    doctorLastIn varchar(25) NOT NULL DEFAULT '',
    doctorLastOut varchar(25) NOT NULL DEFAULT '',
    InActive int(1) NOT NULL DEFAULT 0,
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS patient_personal_info (
    reg_no bigint(20) NOT NULL AUTO_INCREMENT,
    patient_no varchar(15) NOT NULL,
    title int(11) NOT NULL DEFAULT 0,
    lastname varchar(35) NOT NULL,
    firstname varchar(35) NOT NULL,
    middlename varchar(25) NOT NULL DEFAULT '',
    gender int(11) NOT NULL DEFAULT 0,
    civil_status int(11) NOT NULL DEFAULT 0,
    birthday date DEFAULT NULL,
    birthplace varchar(150) NOT NULL DEFAULT '',
    fathers_name varchar(150) NOT NULL DEFAULT '',
    address1 text DEFAULT NULL,
    address2 text DEFAULT NULL,
    age int(3) NOT NULL DEFAULT 0,
    religion int(11) NOT NULL DEFAULT 0,
    street varchar(50) NOT NULL DEFAULT '',
    subd_brgy varchar(90) NOT NULL DEFAULT '',
    province varchar(90) NOT NULL DEFAULT '',
    phone_no varchar(25) NOT NULL DEFAULT '',
    phone_no_office varchar(25) NOT NULL DEFAULT '',
    mobile_no varchar(25) NOT NULL DEFAULT '',
    email_address varchar(50) NOT NULL DEFAULT '',
    picture varchar(100) NOT NULL DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    blood_group int(11) NOT NULL DEFAULT 0,
    Insurance_comp int(11) NOT NULL DEFAULT 0,
    insurance_no varchar(25) NOT NULL DEFAULT '',
    id_identifiers text DEFAULT NULL,
    InActive int(11) NOT NULL DEFAULT 0,
    PRIMARY KEY (reg_no)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS patient_appointment (
    appID bigint(20) NOT NULL AUTO_INCREMENT,
    patient_no varchar(25) NOT NULL,
    appointmentDate date NOT NULL,
    appHour tinyint(2) NOT NULL,
    appMinutes tinyint(2) NOT NULL,
    appAMPM varchar(10) NOT NULL,
    appointmentTime time NOT NULL,
    appointmentReason tinytext DEFAULT NULL,
    consultantDoctor varchar(10) NOT NULL,
    dateVisit datetime DEFAULT NULL,
    appointmentStatus char(1) NOT NULL DEFAULT 'S',
    dateEntry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (appID)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS room_master (
    room_id int(11) NOT NULL AUTO_INCREMENT,
    room_no varchar(50) NOT NULL,
    room_type varchar(50) NOT NULL,
    total_beds int(11) NOT NULL,
    available_beds int(11) NOT NULL,
    price_per_day int(11) NOT NULL,
    floor int(11) NOT NULL DEFAULT 1,
    building varchar(100) NOT NULL DEFAULT 'Main Building',
    total_floors int(11) NOT NULL DEFAULT 5,
    InActive int(1) NOT NULL DEFAULT 0,
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS billing_records (
    bill_id int(11) NOT NULL AUTO_INCREMENT,
    bill_no varchar(50) NOT NULL,
    patient_no varchar(50) NOT NULL,
    bill_date datetime DEFAULT NULL,
    total_amount decimal(10,2) NOT NULL,
    status varchar(20) NOT NULL,
    payment_method varchar(50) NOT NULL,
    date_entry datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bill_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS opd_records (
    ioId varchar(50) NOT NULL,
    patient_no varchar(50) NOT NULL,
    doctor_id varchar(15) NOT NULL,
    dept_id int(11) NOT NULL,
    dateVisit datetime DEFAULT CURRENT_TIMESTAMP,
    complaints text DEFAULT NULL,
    diagnosis text DEFAULT NULL,
    status varchar(20) NOT NULL DEFAULT 'Active',
    isPaid boolean NOT NULL DEFAULT FALSE,
    dateEntry datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ioId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS ipd_admissions (
    ipdId varchar(50) NOT NULL,
    patient_no varchar(50) NOT NULL,
    doctor_id varchar(15) NOT NULL,
    dept_id int(11) NOT NULL,
    room_no varchar(50) DEFAULT '',
    bed_no varchar(50) DEFAULT '',
    complaints text DEFAULT NULL,
    diagnosis text DEFAULT NULL,
    status varchar(20) NOT NULL DEFAULT 'Admitted',
    admitDate datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dateEntry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ipdId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS medicines (
    id int(11) NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    category varchar(100) NOT NULL,
    type varchar(50) NOT NULL,
    uom varchar(50) NOT NULL,
    price int(11) NOT NULL,
    stock int(11) NOT NULL,
    reorder int(11) NOT NULL,
    status varchar(50) NOT NULL,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS nurse_vitals (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    bp varchar(50) DEFAULT '',
    temp varchar(50) DEFAULT '',
    pulse varchar(50) DEFAULT '',
    resp varchar(50) DEFAULT '',
    spo2 varchar(50) DEFAULT '',
    weight varchar(50) DEFAULT '',
    note text DEFAULT NULL,
    by_user varchar(100) DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS nurse_medication (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    med_name varchar(150) NOT NULL,
    dose varchar(50) DEFAULT '',
    route varchar(50) DEFAULT '',
    freq varchar(50) DEFAULT '',
    status varchar(50) DEFAULT '',
    by_user varchar(100) DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  
  `CREATE TABLE IF NOT EXISTS nurse_intake_output (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    intake_type varchar(150) DEFAULT '',
    intake_amount varchar(50) DEFAULT '',
    output_type varchar(150) DEFAULT '',
    output_amount varchar(50) DEFAULT '',
    by_user varchar(100) DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS nurse_progress_note (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    note text NOT NULL,
    by_user varchar(100) DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS nurse_bed_side (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    procedure_name varchar(200) NOT NULL,
    note text DEFAULT NULL,
    by_user varchar(100) DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS nurse_patient_history (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    medical_history text DEFAULT NULL,
    surgical_history text DEFAULT NULL,
    family_history text DEFAULT NULL,
    allergies text DEFAULT NULL,
    by_user varchar(100) DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS nurse_discharge (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    discharge_date varchar(50) DEFAULT '',
    condition_at_discharge varchar(250) DEFAULT '',
    medication_advised text DEFAULT NULL,
    follow_up_instructions text DEFAULT NULL,
    by_user varchar(100) DEFAULT '',
    summary_data longtext DEFAULT NULL,
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  `CREATE TABLE IF NOT EXISTS nurse_room_transfer (
    id int(11) NOT NULL AUTO_INCREMENT,
    patient varchar(100) NOT NULL,
    old_room varchar(100) DEFAULT '',
    new_room varchar(100) DEFAULT '',
    reason varchar(250) DEFAULT '',
    by_user varchar(100) DEFAULT '',
    date_entry datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
];

module.exports = { tenantSchemaQueries };
