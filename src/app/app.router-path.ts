export enum RoutePaths {
  Empty = '',
  AnyOther = '**',
  NotFound = '404',

  Auth = 'auth',
  Register = 'register',

  NewScenario = 'editor/new',
  EditScenario = 'editor/:id',
}
