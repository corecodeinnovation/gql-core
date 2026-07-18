import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: Date; output: Date; }
};

export type ChangeTicketStatusInput = {
  status: TicketStatus;
  ticketId: Scalars['ID']['input'];
};

export type ChangeTicketStatusResult = InvalidStatusTransitionError | NotFoundError | Ticket;

export type CreateProjectInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateProjectResult = Project | ValidationError;

export type CreateTicketInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<TicketPriority>;
  projectId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

export type CreateTicketResult = NotFoundError | Ticket | ValidationError;

export type Error = {
  message: Scalars['String']['output'];
};

export type InvalidStatusTransitionError = Error & {
  __typename?: 'InvalidStatusTransitionError';
  from: TicketStatus;
  message: Scalars['String']['output'];
  to: TicketStatus;
};

export type Mutation = {
  __typename?: 'Mutation';
  changeTicketStatus: ChangeTicketStatusResult;
  createProject: CreateProjectResult;
  createTicket: CreateTicketResult;
};


export type MutationChangeTicketStatusArgs = {
  input: ChangeTicketStatusInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateTicketArgs = {
  input: CreateTicketInput;
};

export type NotFoundError = Error & {
  __typename?: 'NotFoundError';
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
};

export type OrderDirection =
  | 'ASC'
  | 'DESC';

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Project = {
  __typename?: 'Project';
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  tickets: TicketConnection;
};


export type ProjectTicketsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<TicketFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TicketOrder>;
};

export type ProjectConnection = {
  __typename?: 'ProjectConnection';
  edges: Array<ProjectEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ProjectEdge = {
  __typename?: 'ProjectEdge';
  cursor: Scalars['String']['output'];
  node: Project;
};

export type ProjectFilter = {
  search?: InputMaybe<Scalars['String']['input']>;
};

export type ProjectOrder = {
  direction: OrderDirection;
  field: ProjectOrderField;
};

export type ProjectOrderField =
  | 'CREATED_AT'
  | 'NAME';

export type Query = {
  __typename?: 'Query';
  project?: Maybe<Project>;
  projects: ProjectConnection;
  tickets: TicketConnection;
};


export type QueryProjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProjectsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<ProjectFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ProjectOrder>;
};


export type QueryTicketsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<TicketFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TicketOrder>;
};

export type Subscription = {
  __typename?: 'Subscription';
  ticketCreated: Ticket;
  ticketStatusChanged: Ticket;
};


export type SubscriptionTicketCreatedArgs = {
  projectId?: InputMaybe<Scalars['ID']['input']>;
};


export type SubscriptionTicketStatusChangedArgs = {
  projectId?: InputMaybe<Scalars['ID']['input']>;
};

export type Ticket = {
  __typename?: 'Ticket';
  authorSub?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  priority: TicketPriority;
  project: Project;
  status: TicketStatus;
  title: Scalars['String']['output'];
};

export type TicketConnection = {
  __typename?: 'TicketConnection';
  edges: Array<TicketEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type TicketEdge = {
  __typename?: 'TicketEdge';
  cursor: Scalars['String']['output'];
  node: Ticket;
};

export type TicketFilter = {
  priority?: InputMaybe<TicketPriority>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<TicketStatus>;
};

export type TicketOrder = {
  direction: OrderDirection;
  field: TicketOrderField;
};

export type TicketOrderField =
  | 'CREATED_AT'
  | 'PRIORITY'
  | 'TITLE';

export type TicketPriority =
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM';

export type TicketStatus =
  | 'CLOSED'
  | 'DONE'
  | 'IN_PROGRESS'
  | 'OPEN';

export type ValidationError = Error & {
  __typename?: 'ValidationError';
  field: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = ResolversObject<{
  ChangeTicketStatusResult: ( InvalidStatusTransitionError ) | ( NotFoundError ) | ( Ticket );
  CreateProjectResult: ( Project ) | ( ValidationError );
  CreateTicketResult: ( NotFoundError ) | ( Ticket ) | ( ValidationError );
}>;

/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = ResolversObject<{
  Error: ( InvalidStatusTransitionError ) | ( NotFoundError ) | ( ValidationError );
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ChangeTicketStatusInput: ChangeTicketStatusInput;
  ChangeTicketStatusResult: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ChangeTicketStatusResult']>;
  CreateProjectInput: CreateProjectInput;
  CreateProjectResult: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['CreateProjectResult']>;
  CreateTicketInput: CreateTicketInput;
  CreateTicketResult: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['CreateTicketResult']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Error: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Error']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InvalidStatusTransitionError: ResolverTypeWrapper<InvalidStatusTransitionError>;
  Mutation: ResolverTypeWrapper<{}>;
  NotFoundError: ResolverTypeWrapper<NotFoundError>;
  OrderDirection: OrderDirection;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Project: ResolverTypeWrapper<Project>;
  ProjectConnection: ResolverTypeWrapper<ProjectConnection>;
  ProjectEdge: ResolverTypeWrapper<ProjectEdge>;
  ProjectFilter: ProjectFilter;
  ProjectOrder: ProjectOrder;
  ProjectOrderField: ProjectOrderField;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  Ticket: ResolverTypeWrapper<Ticket>;
  TicketConnection: ResolverTypeWrapper<TicketConnection>;
  TicketEdge: ResolverTypeWrapper<TicketEdge>;
  TicketFilter: TicketFilter;
  TicketOrder: TicketOrder;
  TicketOrderField: TicketOrderField;
  TicketPriority: TicketPriority;
  TicketStatus: TicketStatus;
  ValidationError: ResolverTypeWrapper<ValidationError>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Boolean: Scalars['Boolean']['output'];
  ChangeTicketStatusInput: ChangeTicketStatusInput;
  ChangeTicketStatusResult: ResolversUnionTypes<ResolversParentTypes>['ChangeTicketStatusResult'];
  CreateProjectInput: CreateProjectInput;
  CreateProjectResult: ResolversUnionTypes<ResolversParentTypes>['CreateProjectResult'];
  CreateTicketInput: CreateTicketInput;
  CreateTicketResult: ResolversUnionTypes<ResolversParentTypes>['CreateTicketResult'];
  DateTime: Scalars['DateTime']['output'];
  Error: ResolversInterfaceTypes<ResolversParentTypes>['Error'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  InvalidStatusTransitionError: InvalidStatusTransitionError;
  Mutation: {};
  NotFoundError: NotFoundError;
  PageInfo: PageInfo;
  Project: Project;
  ProjectConnection: ProjectConnection;
  ProjectEdge: ProjectEdge;
  ProjectFilter: ProjectFilter;
  ProjectOrder: ProjectOrder;
  Query: {};
  String: Scalars['String']['output'];
  Subscription: {};
  Ticket: Ticket;
  TicketConnection: TicketConnection;
  TicketEdge: TicketEdge;
  TicketFilter: TicketFilter;
  TicketOrder: TicketOrder;
  ValidationError: ValidationError;
}>;

export type ChangeTicketStatusResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ChangeTicketStatusResult'] = ResolversParentTypes['ChangeTicketStatusResult']> = ResolversObject<{
  __resolveType: TypeResolveFn<'InvalidStatusTransitionError' | 'NotFoundError' | 'Ticket', ParentType, ContextType>;
}>;

export type CreateProjectResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateProjectResult'] = ResolversParentTypes['CreateProjectResult']> = ResolversObject<{
  __resolveType: TypeResolveFn<'Project' | 'ValidationError', ParentType, ContextType>;
}>;

export type CreateTicketResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateTicketResult'] = ResolversParentTypes['CreateTicketResult']> = ResolversObject<{
  __resolveType: TypeResolveFn<'NotFoundError' | 'Ticket' | 'ValidationError', ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type ErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['Error'] = ResolversParentTypes['Error']> = ResolversObject<{
  __resolveType: TypeResolveFn<'InvalidStatusTransitionError' | 'NotFoundError' | 'ValidationError', ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
}>;

export type InvalidStatusTransitionErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InvalidStatusTransitionError'] = ResolversParentTypes['InvalidStatusTransitionError']> = ResolversObject<{
  from?: Resolver<ResolversTypes['TicketStatus'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['TicketStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  changeTicketStatus?: Resolver<ResolversTypes['ChangeTicketStatusResult'], ParentType, ContextType, RequireFields<MutationChangeTicketStatusArgs, 'input'>>;
  createProject?: Resolver<ResolversTypes['CreateProjectResult'], ParentType, ContextType, RequireFields<MutationCreateProjectArgs, 'input'>>;
  createTicket?: Resolver<ResolversTypes['CreateTicketResult'], ParentType, ContextType, RequireFields<MutationCreateTicketArgs, 'input'>>;
}>;

export type NotFoundErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['NotFoundError'] = ResolversParentTypes['NotFoundError']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = ResolversObject<{
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProjectResolvers<ContextType = any, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tickets?: Resolver<ResolversTypes['TicketConnection'], ParentType, ContextType, Partial<ProjectTicketsArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProjectConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectConnection'] = ResolversParentTypes['ProjectConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['ProjectEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ProjectEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectEdge'] = ResolversParentTypes['ProjectEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  project?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType, RequireFields<QueryProjectArgs, 'id'>>;
  projects?: Resolver<ResolversTypes['ProjectConnection'], ParentType, ContextType, Partial<QueryProjectsArgs>>;
  tickets?: Resolver<ResolversTypes['TicketConnection'], ParentType, ContextType, Partial<QueryTicketsArgs>>;
}>;

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = ResolversObject<{
  ticketCreated?: SubscriptionResolver<ResolversTypes['Ticket'], "ticketCreated", ParentType, ContextType, Partial<SubscriptionTicketCreatedArgs>>;
  ticketStatusChanged?: SubscriptionResolver<ResolversTypes['Ticket'], "ticketStatusChanged", ParentType, ContextType, Partial<SubscriptionTicketStatusChangedArgs>>;
}>;

export type TicketResolvers<ContextType = any, ParentType extends ResolversParentTypes['Ticket'] = ResolversParentTypes['Ticket']> = ResolversObject<{
  authorSub?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  priority?: Resolver<ResolversTypes['TicketPriority'], ParentType, ContextType>;
  project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TicketStatus'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TicketConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TicketConnection'] = ResolversParentTypes['TicketConnection']> = ResolversObject<{
  edges?: Resolver<Array<ResolversTypes['TicketEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TicketEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['TicketEdge'] = ResolversParentTypes['TicketEdge']> = ResolversObject<{
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Ticket'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ValidationErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ValidationError'] = ResolversParentTypes['ValidationError']> = ResolversObject<{
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = any> = ResolversObject<{
  ChangeTicketStatusResult?: ChangeTicketStatusResultResolvers<ContextType>;
  CreateProjectResult?: CreateProjectResultResolvers<ContextType>;
  CreateTicketResult?: CreateTicketResultResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Error?: ErrorResolvers<ContextType>;
  InvalidStatusTransitionError?: InvalidStatusTransitionErrorResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NotFoundError?: NotFoundErrorResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Project?: ProjectResolvers<ContextType>;
  ProjectConnection?: ProjectConnectionResolvers<ContextType>;
  ProjectEdge?: ProjectEdgeResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Ticket?: TicketResolvers<ContextType>;
  TicketConnection?: TicketConnectionResolvers<ContextType>;
  TicketEdge?: TicketEdgeResolvers<ContextType>;
  ValidationError?: ValidationErrorResolvers<ContextType>;
}>;

