/**
 * Type definitions for NDB MCP Server
 */

// Configuration interfaces
export interface NDBConfig {
  baseUrl: string;
  username: string;
  password: string;
  timeout?: number;
  verifySsl?: boolean;
}

// Tool call argument types
export interface ToolCallArgs {
  [key: string]: any;
}

// Database types
export type DatabaseEngine = 
  | 'oracle_database'
  | 'postgres_database'
  | 'sqlserver_database'
  | 'mariadb_database'
  | 'mysql_database'
  | 'saphana_database'
  | 'mongodb_database';

export type ProfileType = 
  | 'Software'
  | 'Compute'
  | 'Network'
  | 'Database_Parameter';

export type ValueType = 
  | 'id'
  | 'name'
  | 'database-name'
  | 'ip'
  | 'vm-cluster-name'
  | 'vm-cluster-uuid'
  | 'dbserver-cluster-id'
  | 'nx-cluster-id'
  | 'fqdn';

// Action argument interface
export interface ActionArgument {
  name: string;
  value: string | number | boolean;
}

// Tag interface
export interface Tag {
  tagId: string;
  value: string;
}

// Database operation interfaces
export interface DatabaseListParams {
  valueType?: ValueType;
  value?: string;
  detailed?: boolean;
  loadDbserverCluster?: boolean;
  orderByDbserverCluster?: boolean;
  orderByDbserverLogicalCluster?: boolean;
  timeZone?: string;
}

export interface DatabaseGetParams {
  valueType?: ValueType;
  detailed?: boolean;
  loadDbserverCluster?: boolean;
  timeZone?: string;
}

export interface ProvisionDatabaseRequest {
  databaseType: string;
  name: string;
  databaseDescription?: string;
  softwareProfileId: string;
  softwareProfileVersionId: string;
  computeProfileId: string;
  networkProfileId: string;
  dbParameterProfileId: string;
  newDbServerTimeZone: string;
  timeMachineInfo: TimeMachineInfo;
  actionArguments: ActionArgument[];
  createDbserver: boolean;
  nodeCount: number;
  nxClusterId: string;
  sshPublicKey: string;
  clustered: boolean;
  nodes: DatabaseNode[];
  autoTuneStagingDrive?: boolean;
  slaId?: string;
  skipValidation?: boolean;
}

export interface RegisterDatabaseRequest {
  databaseType: DatabaseEngine;
  databaseName: string;
  description?: string;
  clustered?: boolean;
  forcedInstall?: boolean;
  vmIp: string;
  vmUsername?: string;
  vmPassword?: string;
  vmSshkey?: string;
  vmDescription?: string;
  autoTuneStagingDrive?: boolean;
  workingDirectory?: string;
  timeMachineInfo: TimeMachineInfo;
  tags?: Tag[];
  nxClusterId: string;
  actionArguments: ActionArgument[];
}

export interface UpdateDatabaseRequest {
  name?: string;
  description?: string;
  tags?: Tag[];
  resetName?: boolean;
  resetDescription?: boolean;
  resetTags?: boolean;
}

export interface DeregisterDatabaseRequest {
  softRemove?: boolean;
  remove?: boolean;
  delete?: boolean;
  forced?: boolean;
  deleteTimeMachine?: boolean;
}

// Time Machine interfaces
export interface TimeMachineInfo {
  name: string;
  description?: string;
  slaId?: string;
  schedule?: Schedule;
  tags?: Tag[];
  autoTuneLogDrive?: boolean;
}

export interface Schedule {
  snapshotTimeOfDay?: SnapshotTimeOfDay;
  continuousSchedule?: ContinuousSchedule;
  weeklySchedule?: WeeklySchedule;
  monthlySchedule?: MonthlySchedule;
  quarterlySchedule?: QuarterlySchedule;
  yearlySchedule?: YearlySchedule;
}

export interface SnapshotTimeOfDay {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ContinuousSchedule {
  enabled: boolean;
  logBackupInterval?: number;
  snapshotsPerDay?: number;
}

export interface WeeklySchedule {
  enabled: boolean;
  dayOfWeek?: string;
}

export interface MonthlySchedule {
  enabled: boolean;
  dayOfMonth?: number;
}

export interface QuarterlySchedule {
  enabled: boolean;
  startMonth?: string;
  dayOfMonth?: number;
}

export interface YearlySchedule {
  enabled: boolean;
  month?: string;
  dayOfMonth?: number;
}

// Node interface for provisioning
export interface Node {
  vmName: string;
  computeProfileId?: string;
  networkProfileId?: string;
  newDbServerTimeZone?: string;
  nxClusterId?: string;
  properties?: ActionArgument[];
}

export interface DatabaseNode {
  vmName: string;
  properties: any[];
}

// Clone interfaces
export interface CreateCloneRequest {
  name: string;
  description?: string;
  createDbserver: boolean;
  clustered: boolean;
  nxClusterId: string;
  sshPublicKey: string;
  dbserverId?: string;
  dbserverClusterId?: string;
  dbserverLogicalClusterId?: string;
  timeMachineId: string;
  snapshotId?: string;
  userPitrTimestamp?: string;
  newDbServerTimeZone?: string;
  timeZone?: string;
  latestSnapshot?: boolean;
  nodeCount: number;
  nodes: Node[];
  tags?: Tag[];
  actionArguments: ActionArgument[];
  computeProfileId?: string;
  networkProfileId?: string;
  databaseParameterProfileId?: string;
}

export interface RefreshCloneRequest {
  snapshotId?: string;
  pitrTimestamp?: string;
  latestSnapshot?: boolean;
  timeZone?: string;
}

export interface DeleteCloneRequest {
  softRemove?: boolean;
  remove?: boolean;
  delete?: boolean;
  forced?: boolean;
  deleteDataDrives?: boolean;
  deleteLogicalCluster?: boolean;
  removeLogicalCluster?: boolean;
  deleteTimeMachine?: boolean;
}

// Database Server interfaces
export interface RegisterDBServerRequest {
  vmIp: string;
  nxClusterUuid: string;
  forcedInstall?: boolean;
  workingDirectory?: string;
  databaseType: DatabaseEngine;
  username: string;
  password: string;
  actionArguments: ActionArgument[];
}

export interface UpdateDBServerRequest {
  description?: string;
  tags?: Tag[];
}

// Snapshot interfaces
export interface TakeSnapshotRequest {
  name?: string;
  lcmConfig?: {
    snapshotLCMConfig?: {
      expiryDetails?: {
        expireInDays?: number;
        expiryDateTimezone?: string;
      };
    };
  };
}

// Time Machine operation interfaces
export interface PauseTimeMachineRequest {
  forced?: boolean;
  reason?: string;
  ownerId?: string;
}

export interface ResumeTimeMachineRequest {
  resetCapability?: boolean;
  skipSnapshot?: boolean;
  skipLogCatchup?: boolean;
  reason?: string;
  ownerId?: string;
  snapshotName?: string;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface TaskInfoSummary {
  name: string;
  workId: string;
  operationId: string;
  dbserverId?: string;
  message?: string;
  entityId: string;
  entityName: string;
  entityType: string;
  status: string;
  associatedOperations?: TaskInfoSummary[];
}

export interface ERADatabase {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  dateCreated: string;
  dateModified: string;
  clustered: boolean;
  clone: boolean;
  eraCreated: boolean;
  placeholder: boolean;
  databaseName: string;
  type: string;
  databaseClusterType?: string;
  status: string;
  databaseStatus: string;
  dbserverLogicalClusterId?: string;
  timeMachineId: string;
  parentTimeMachineId?: string;
  timeZone: string;
  tags?: Tag[];
}

export interface ERAClone extends ERADatabase {
  parentTimeMachineId: string;
}

export interface ERATimeMachine {
  id: string;
  name: string;
  description?: string;
  clustered: boolean;
  clone: boolean;
  databaseId: string;
  logDriveId?: string;
  type: string;
  status: string;
  eaStatus?: string;
  scope: string;
  slaId?: string;
  scheduleId?: string;
  ownerId: string;
  dateCreated: string;
  dateModified: string;
  tags?: Tag[];
}

export interface ERASnapshot {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  dateCreated: string;
  dateModified: string;
  snapshotId: string;
  snapshotUuid: string;
  protectionDomainId: string;
  timeMachineId: string;
  databaseNodeId: string;
  status: string;
  type: string;
  applicableTypes: string[];
  snapshotTimeStamp: string;
  tags?: Tag[];
}

export interface ERACluster {
  id: string;
  name: string;
  uniqueName: string;
  ipAddresses: string[];
  fqdns: string[];
  description?: string;
  cloudType: string;
  dateCreated: string;
  dateModified: string;
  ownerId: string;
  status: string;
  version: string;
  hypervisorType: string;
  hypervisorVersion: string;
  usedLogicalSizeInMB?: number;
  allocatedLogicalSizeInMB?: number;
}

export interface ERADBServer {
  id: string;
  eraCreated: boolean;
  dbserverClusterId?: string;
  name: string;
  description?: string;
  vmClusterName?: string;
  vmClusterUuid?: string;
  ipAddresses: string[];
  fqdns: string[];
  macAddresses: string[];
  type: string;
  placeholder: boolean;
  status: string;
  clientId: string;
  nxClusterId: string;
  eraDriveId?: string;
  eraVersion?: string;
  vmTimeZone?: string;
  ownerId: string;
  dateCreated: string;
  dateModified: string;
  clustered: boolean;
  databaseType?: string;
  tags?: Tag[];
}

export interface ERAProfile {
  id: string;
  name: string;
  description?: string;
  dateCreated: string;
  dateModified: string;
  owner: string;
  engineType: DatabaseEngine;
  type: ProfileType;
  nxClusterId?: string;
  topology: string;
  dbVersion: string;
  systemProfile: boolean;
  latestVersion?: string;
  latestVersionId?: string;
}

export interface ERASLA {
  id: string;
  name: string;
  uniqueName: string;
  description?: string;
  ownerId: string;
  systemSla: boolean;
  dateCreated: string;
  dateModified: string;
  continuousRetention: number;
  dailyRetention: number;
  weeklyRetention: number;
  monthlyRetention: number;
  quarterlyRetention: number;
  yearlyRetention: number;
  referenceCount: number;
}

export interface ERAOperation {
  id: string;
  name: string;
  type: string;
  status: string;
  systemTriggered: boolean;
  userVisible: boolean;
  dbserverId?: string;
  startTime: string;
  endTime?: string;
  percentageComplete: string;
  entityId: string;
  entityName: string;
  entityType: string;
  dateSubmitted: string;
  ownerId: string;
}

export interface ERAAlert {
  id: string;
  message: string;
  dateCreated: string;
  dateModified: string;
  entityType: string;
  entityId: string;
  entityName: string;
  policyId: string;
  operationId?: string;
  ownerId: string;
  severity: string;
  resetResolved: boolean;
  resolved: boolean;
  dateResolved?: string;
  resetAcknowledged: boolean;
  acknowledged: boolean;
  dateAcknowledged?: string;
  notified: boolean;
}
