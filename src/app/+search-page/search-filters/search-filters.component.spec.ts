import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SearchFilterService } from './search-filter/search-filter.service';
import { SearchFiltersComponent } from './search-filters.component';
import { SearchService } from '../search-service/search.service';
import { SearchConfigurationService } from '../search-service/search-configuration.service';
import { of as observableOf } from 'rxjs';

describe('SearchFiltersComponent', () => {
  let comp: SearchFiltersComponent;
  let fixture: ComponentFixture<SearchFiltersComponent>;
  let searchService: SearchService;
  const searchServiceStub = {
    /* tslint:disable:no-empty */
    getConfig: () =>
      observableOf({ hasSucceeded: true, payload: [] }),
    getClearFiltersQueryParams: () => {
    },
    getSearchLink: () => {
    }
    /* tslint:enable:no-empty */
  };

  const searchFiltersStub = {
    getSelectedValuesForFilter: (filter) =>
      []
  };

  const searchConfigServiceStub = jasmine.createSpyObj('SearchConfigurationService', {
    getCurrentFrontendFilters: observableOf({})
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RouterTestingModule.withRoutes([]), NoopAnimationsModule],
      declarations: [SearchFiltersComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceStub },
        { provide: SearchConfigurationService, useValue: searchConfigServiceStub },
        { provide: SearchFilterService, useValue: searchFiltersStub },

      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(SearchFiltersComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchFiltersComponent);
    comp = fixture.componentInstance; // SearchFiltersComponent test instance
    fixture.detectChanges();
    searchService = (comp as any).searchService;
  });

  describe('when the getSearchLink method is called', () => {
    beforeEach(() => {
      spyOn(searchService, 'getSearchLink');
      comp.getSearchLink();
    });

    it('should call getSearchLink on the searchService', () => {
      expect(searchService.getSearchLink).toHaveBeenCalled()
    });
  });

});
