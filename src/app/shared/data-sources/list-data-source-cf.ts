import { OperatorFunction } from 'rxjs/interfaces';
import { getPaginationObservables } from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { resultPerPageParam, } from './../../store/reducers/pagination-reducer/pagination-reducer.types';
import { ListPagination, ListSort, ListFilter } from '../../store/actions/list.actions';
import { EntityInfo } from '../../store/types/api.types';
import { fileExists } from 'ts-node/dist';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MatPaginator, MatSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { PaginationEntityState, PaginatedAction, QParam } from '../../store/types/pagination.types';
import { AppState } from '../../store/app-state';
import { AddParams, SetPage, RemoveParams } from '../../store/actions/pagination.actions';
import { ListDataSource } from './list-data-source';
import { IListDataSource, getRowUniqueId } from './list-data-source-types';
import { map } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/operators';
import { composeFn } from '../../store/helpers/reducer.helper';

export abstract class CfListDataSource<T, A = T> extends ListDataSource<T> implements IListDataSource<T> {

  // private cfUberSub: Subscription;

  // public pagination$: Observable<any>;

  private entities$: Observable<T>;
  private listPaginationWithCfPagination$;
  private cfPaginationWithListPagination$;
  private sortSub$;

  public isLoadingPage$: Observable<boolean> = Observable.of(false);
  public filteredRows: Array<T>;

  private orderDirectionParam = 'order-direction';
  public localDataFunctions?: ((entities: T[], paginationState: PaginationEntityState) => T[])[] = [];

  public getFilterFromParams(pag: PaginationEntityState) {
    return pag.params.filter;
  }
  public setFilterParam(filter: ListFilter) {
    if (filter && filter.filter && filter.filter.length) {
      this._cfStore.dispatch(new AddParams(this.entityKey, this.paginationKey, {
        filter: filter.filter
      }, this.isLocal));
    } else {
      // if (pag.params.q.find((q: QParam) => q.key === 'name'))
      this._cfStore.dispatch(new RemoveParams(this.entityKey, this.paginationKey, ['filter'], [], this.isLocal));
    }
  }

  constructor(
    protected _cfStore: Store<AppState>,
    protected action: PaginatedAction,
    protected sourceScheme: schema.Entity,
    protected _cfGetRowUniqueId: getRowUniqueId,
    getEmptyType: () => T,
    public paginationKey: string,
    private entityLettable: OperatorFunction<A[], T[]> = null,
    public isLocal = false
  ) {
    super(_cfStore, _cfGetRowUniqueId, getEmptyType, paginationKey);

    this.entityKey = sourceScheme.key;
    const { pagination$, entities$ } = getPaginationObservables({
      store: this._cfStore,
      action: this.action,
      schema: [this.sourceScheme]
    },
      null,
      isLocal
    );


    if (this.entityLettable) {
      this.page$ = entities$.pipe(
        this.entityLettable
      );
    } else {
      this.page$ = entities$.pipe(
        map(res => res as T[])
      );
    }
    if (isLocal) {
      this.page$ = this.page$.pipe(
        withLatestFrom(pagination$),
        map(([entities, paginationEntity]) => {
          if (this.localDataFunctions && this.localDataFunctions.length) {
            entities = this.localDataFunctions.reduce((value, fn) => {
              return fn(value, paginationEntity);
            }, entities);
          }
          const pages = this.splitClientPages(entities, paginationEntity.clientPagination.pageSize);
          return pages[paginationEntity.clientPagination.currentPage - 1];
        })
      );
    }

    // Track changes from listPagination to cfPagination
    // this.listPaginationWithCfPagination$ = this.pagination$.withLatestFrom(pagination$)
    //   .do(([listPagination, pag]: [ListPagination, PaginationEntityState]) => {
    //     if (pag.params[resultPerPageParam] !== listPagination.pageSize) {
    //       console.log('adding params');
    //       this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
    //         [resultPerPageParam]: listPagination.pageSize
    //       }));
    //     }
    //     if (pag.currentPage - 1 !== listPagination.pageIndex) {
    //       this._cfStore.dispatch(new SetPage(this.sourceScheme.key, this.action.paginationKey, listPagination.pageIndex + 1));
    //     }
    //   });

    // // Track changes from cfPagination to listPagination. This should be the only one
    // this.cfPaginationWithListPagination$ = pagination$.withLatestFrom(this.pagination$)
    //   .do(([pag, listPagination]: [PaginationEntityState, ListPagination]) => {
    //     if (pag.totalResults !== listPagination.totalResults) {
    //       console.log(pag);
    //       this._cfStore.dispatch(new SetListPaginationAction(this._cfListStateKey, {
    //         totalResults: pag.totalResults,
    //       }));
    //     }
    //   });

    // Track changes from listSort to cfPagination
    // this.sortSub$ = this.sort$
    //   .withLatestFrom(pagination$)
    //   .do(([sortObj, pagination]) => {
    //     const orderParam = pagination.params[this.orderDirectionParam];
    //     if (!orderParam || orderParam !== sortObj.direction) {
    //       console.log('adding params sprt');
    //       this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
    //         [this.orderDirectionParam]: sortObj.direction
    //       }));
    //     }
    //   });

    // this.cfUberSub = Observable.combineLatest(
    //   this.listPaginationWithCfPagination$,
    //   this.cfPaginationWithListPagination$,
    //   this.sortSub$
    // ).subscribe();

    this.pagination$ = pagination$;
    this.isLoadingPage$ = this.pagination$.map((pag: PaginationEntityState) => pag.fetching);
  }

  splitClientPages(entites: T[], pageSize: number): T[][] {
    if (!entites || !entites.length) {
      return [];
    }
    const array = [...entites];
    const pages = [];

    for (let i = 0; i < array.length; i += pageSize) {
      pages.push(array.slice(i, i + pageSize));
    }
    return pages;
  }

  connect(): Observable<T[]> {
    return this.page$;
  }

  destroy() {
    // this.cfUberSub.unsubscribe();
  }
}
