/*
 *  Copyright 2023 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { act, render, screen } from '@testing-library/react';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import { ENTITY_PERMISSIONS } from 'mocks/Permissions.mock';
import { MOCK_DATABASE_SERVICE, MOCK_VERSIONS_LIST } from 'mocks/Service.mock';
import React from 'react';
import { useParams } from 'react-router-dom';
import ServiceVersionPage from './ServiceVersionPage';

const mockParams = {
  serviceCategory: 'databaseServices',
  version: '1.2',
  fqn: 'sample_data',
};
const mockPush = jest.fn();
const mockOtherData = { data: [], paging: {} };

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn().mockImplementation(() => ({ push: mockPush })),
  useParams: jest.fn().mockImplementation(() => mockParams),
}));

jest.mock('components/containers/PageLayoutV1', () =>
  jest
    .fn()
    .mockImplementation(({ children }) => (
      <div data-testid="page-layout-v1">{children}</div>
    ))
);

jest.mock('components/common/error-with-placeholder/ErrorPlaceHolder', () =>
  jest.fn().mockImplementation(() => <div>ErrorPlaceHolder</div>)
);

jest.mock(
  'components/DataAssets/DataAssetsVersionHeader/DataAssetsVersionHeader',
  () => jest.fn().mockImplementation(() => <div>DataAssetsVersionHeader</div>)
);

jest.mock('components/TabsLabel/TabsLabel.component', () =>
  jest.fn().mockImplementation(({ name }) => <div>{name}</div>)
);

jest.mock('components/common/error-with-placeholder/ErrorPlaceHolder', () =>
  jest.fn().mockImplementation(() => <div>ErrorPlaceHolder</div>)
);

jest.mock('components/Entity/EntityVersionTimeLine/EntityVersionTimeLine', () =>
  jest.fn().mockImplementation(({ versionHandler, onBack }) => (
    <div>
      EntityVersionTimeLine
      <div onClick={() => versionHandler('0.7')}>versionHandler</div>
      <div onClick={onBack}>onBack</div>
    </div>
  ))
);

jest.mock('components/Loader/Loader', () =>
  jest.fn().mockImplementation(() => <div>Loader</div>)
);

jest.mock('./ServiceVersionMainTabContent', () =>
  jest.fn().mockImplementation(() => <div>ServiceVersionMainTabContent</div>)
);

jest.mock('components/PermissionProvider/PermissionProvider', () => ({
  usePermissionProvider: jest.fn().mockImplementation(() => ({
    getEntityPermissionByFqn: jest
      .fn()
      .mockImplementation(() => ENTITY_PERMISSIONS),
  })),
}));

jest.mock('rest/serviceAPI', () => ({
  getServiceByFQN: jest.fn().mockImplementation(() => MOCK_DATABASE_SERVICE),
  getServiceVersionData: jest
    .fn()
    .mockImplementation(() => MOCK_DATABASE_SERVICE),
  getServiceVersions: jest.fn().mockImplementation(() => MOCK_VERSIONS_LIST),
}));

jest.mock('rest/dashboardAPI', () => ({
  getDashboards: jest.fn().mockImplementation(() => mockOtherData),
}));

jest.mock('rest/databaseAPI', () => ({
  getDatabases: jest.fn().mockImplementation(() => mockOtherData),
}));

jest.mock('rest/mlModelAPI', () => ({
  getMlModels: jest.fn().mockImplementation(() => mockOtherData),
}));

jest.mock('rest/pipelineAPI', () => ({
  getPipelines: jest.fn().mockImplementation(() => mockOtherData),
}));

jest.mock('rest/storageAPI', () => ({
  getContainers: jest.fn().mockImplementation(() => mockOtherData),
}));

jest.mock('rest/topicsAPI', () => ({
  getTopics: jest.fn().mockImplementation(() => mockOtherData),
}));

describe('ServiceVersionPage tests', () => {
  it('Component should render properly for databaseServices while having view permissions', async () => {
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(
      screen.getByText('ServiceVersionMainTabContent')
    ).toBeInTheDocument();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });

  it('Correct version should reflect in the URL while changing versions form EntityVersionTimeline', async () => {
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    const versionHandler = screen.getByText('versionHandler');

    await act(async () => {
      versionHandler.click();
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      '/service/databaseServices/sample_data/versions/0.7'
    );
  });

  it('Closing the version page should redirect to the service details page', async () => {
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    const onBack = screen.getByText('onBack');

    await act(async () => {
      onBack.click();
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      '/service/databaseServices/sample_data'
    );
  });

  it('Component should render properly in case of only ViewBasic permissions', async () => {
    (usePermissionProvider as jest.Mock).mockImplementationOnce(() => ({
      getEntityPermissionByFqn: jest
        .fn()
        .mockImplementation(() => ({ ViewAll: false, ViewBasic: true })),
    }));

    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(
      screen.getByText('ServiceVersionMainTabContent')
    ).toBeInTheDocument();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });

  it('Error placeholder should be displayed in case of no view permissions', async () => {
    (usePermissionProvider as jest.Mock).mockImplementationOnce(() => ({
      getEntityPermissionByFqn: jest
        .fn()
        .mockImplementation(() => ({ ViewAll: false, ViewBasic: false })),
    }));

    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('ErrorPlaceHolder')).toBeInTheDocument();
  });

  it('Component should render properly for messagingServices', async () => {
    (useParams as jest.Mock).mockImplementation(() => ({
      ...mockParams,
      serviceCategory: 'messagingServices',
    }));
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(
      screen.getByText('ServiceVersionMainTabContent')
    ).toBeInTheDocument();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });

  it('Component should render properly for dashboardServices', async () => {
    (useParams as jest.Mock).mockImplementation(() => ({
      ...mockParams,
      serviceCategory: 'dashboardServices',
    }));
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(
      screen.getByText('ServiceVersionMainTabContent')
    ).toBeInTheDocument();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });

  it('Component should render properly for pipelineServices', async () => {
    (useParams as jest.Mock).mockImplementation(() => ({
      version: '1.2',
      fqn: 'sample_data',
      serviceCategory: 'pipelineServices',
    }));
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(
      screen.getByText('ServiceVersionMainTabContent')
    ).toBeInTheDocument();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });

  it('Component should render properly for storageServices', async () => {
    (useParams as jest.Mock).mockImplementation(() => ({
      version: '1.2',
      fqn: 'sample_data',
      serviceCategory: 'storageServices',
    }));
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(
      screen.getByText('ServiceVersionMainTabContent')
    ).toBeInTheDocument();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });

  it('Component should render properly for mlmodelServices', async () => {
    (useParams as jest.Mock).mockImplementation(() => ({
      version: '1.2',
      fqn: 'sample_data',
      serviceCategory: 'mlmodelServices',
    }));
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(
      screen.getByText('ServiceVersionMainTabContent')
    ).toBeInTheDocument();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });

  it('Only basic information should be rendered for metadataServices', async () => {
    (useParams as jest.Mock).mockImplementation(() => ({
      version: '1.2',
      fqn: 'sample_data',
      serviceCategory: 'metadataServices',
    }));
    await act(async () => {
      render(<ServiceVersionPage />);

      expect(screen.getByText('Loader')).toBeInTheDocument();
    });

    expect(screen.getByText('DataAssetsVersionHeader')).toBeInTheDocument();
    expect(screen.queryByText('ServiceVersionMainTabContent')).toBeNull();
    expect(screen.getByText('EntityVersionTimeLine')).toBeInTheDocument();
  });
});
