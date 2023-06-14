/*
 *  Copyright 2022 Collate.
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

import { Card, Col, Row, Typography } from 'antd';
import { AxiosError } from 'axios';
import ResizablePanels from 'components/common/ResizablePanels/ResizablePanels';
import { HTTP_STATUS_CODE } from 'constants/auth.constants';
import { CreateTestCase } from 'generated/api/tests/createTestCase';
import { t } from 'i18next';
import { isUndefined } from 'lodash';
import { default as React, useCallback, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { createExecutableTestSuite, createTestCase } from 'rest/testAPI';
import { getEntityBreadcrumbs, getEntityName } from 'utils/EntityUtils';
import { getTableTabPath } from '../../constants/constants';
import { STEPS_FOR_ADD_TEST_CASE } from '../../constants/profiler.constant';
import { EntityType } from '../../enums/entity.enum';
import { FormSubmitType } from '../../enums/form.enum';
import { ProfilerDashboardType } from '../../enums/table.enum';
import { OwnerType } from '../../enums/user.enum';
import { TestCase } from '../../generated/tests/testCase';
import { TestSuite } from '../../generated/tests/testSuite';
import { getCurrentUserId } from '../../utils/CommonUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import SuccessScreen from '../common/success-screen/SuccessScreen';
import TitleBreadcrumb from '../common/title-breadcrumb/title-breadcrumb.component';
import { TitleBreadcrumbProps } from '../common/title-breadcrumb/title-breadcrumb.interface';
import IngestionStepper from '../IngestionStepper/IngestionStepper.component';
import { AddDataQualityTestProps } from './AddDataQualityTest.interface';
import RightPanel from './components/RightPanel';
import TestCaseForm from './components/TestCaseForm';
import { addTestSuiteRightPanel, INGESTION_DATA } from './rightPanelData';
import TestSuiteIngestion from './TestSuiteIngestion';

const AddDataQualityTestV1: React.FC<AddDataQualityTestProps> = ({
  table,
}: AddDataQualityTestProps) => {
  const { entityTypeFQN, dashboardType } = useParams<Record<string, string>>();
  const isColumnFqn = dashboardType === ProfilerDashboardType.COLUMN;
  const history = useHistory();
  const [activeServiceStep, setActiveServiceStep] = useState(1);
  const [testCaseData, setTestCaseData] = useState<CreateTestCase>();
  const [testSuiteData, setTestSuiteData] = useState<TestSuite>();
  const [testCaseRes, setTestCaseRes] = useState<TestCase>();
  const [addIngestion, setAddIngestion] = useState(false);

  const breadcrumb = useMemo(() => {
    const data: TitleBreadcrumbProps['titleLinks'] = [
      ...getEntityBreadcrumbs(table, EntityType.TABLE),
      {
        name: getEntityName(table),
        url: getTableTabPath(table.fullyQualifiedName || '', 'profiler'),
      },
      {
        name: t('label.add-entity-test', {
          entity: isColumnFqn ? t('label.column') : t('label.table'),
        }),
        url: '',
        activeTitle: true,
      },
    ];

    return data;
  }, [table, entityTypeFQN, isColumnFqn]);

  const owner = useMemo(
    () => ({
      id: getCurrentUserId(),
      type: OwnerType.USER,
    }),
    [getCurrentUserId]
  );

  const handleRedirection = () => {
    history.goBack();
  };

  const getTestSuiteFqn = async () => {
    try {
      if (isUndefined(table.testSuite)) {
        const testSuite = {
          name: `${table.name}.TestSuite`,
          executableEntityReference: table.fullyQualifiedName,
          owner,
        };
        const response = await createExecutableTestSuite(testSuite);
        setTestSuiteData(response);

        return response.fullyQualifiedName ?? '';
      }
      setTestSuiteData(table.testSuite);

      return table.testSuite?.fullyQualifiedName ?? '';
    } catch (error) {
      showErrorToast(error as AxiosError);
    }

    return '';
  };

  const handleFormSubmit = async (data: CreateTestCase) => {
    setTestCaseData(data);

    try {
      const testSuite = await getTestSuiteFqn();

      const testCasePayload: CreateTestCase = {
        ...data,
        owner,
        testSuite,
      };

      const testCaseResponse = await createTestCase(testCasePayload);
      setActiveServiceStep(2);
      setTestCaseRes(testCaseResponse);
    } catch (error) {
      if (
        (error as AxiosError).response?.status === HTTP_STATUS_CODE.CONFLICT
      ) {
        showErrorToast(
          t('server.entity-already-exist', {
            entity: t('label.test-case'),
            entityPlural: t('label.test-case-lowercase-plural'),
            name: data.name,
          })
        );
      } else {
        showErrorToast(
          error as AxiosError,
          t('server.create-entity-error', {
            entity: t('label.test-case-lowercase'),
          })
        );
      }
    }
  };

  const RenderSelectedTab = useCallback(() => {
    if (activeServiceStep === 2) {
      const isNewTestSuite = isUndefined(table.testSuite);

      const successMessage = isNewTestSuite ? undefined : (
        <span>
          <span className="tw-mr-1 tw-font-semibold">{`"${
            testCaseRes?.name ?? t('label.test-case')
          }"`}</span>
          <span>
            {`${t('message.has-been-created-successfully')}.`}
            &nbsp;
            {t('message.this-will-pick-in-next-run')}
          </span>
        </span>
      );

      return (
        <SuccessScreen
          handleIngestionClick={() => setAddIngestion(true)}
          handleViewServiceClick={handleRedirection}
          name={testCaseRes?.name ?? t('label.test-case')}
          showIngestionButton={isNewTestSuite}
          state={FormSubmitType.ADD}
          successMessage={successMessage}
          viewServiceText={t('message.view-test-suite')}
        />
      );
    }

    return (
      <TestCaseForm
        initialValue={testCaseData}
        table={table}
        onCancel={handleRedirection}
        onSubmit={handleFormSubmit}
      />
    );
  }, [activeServiceStep, testCaseRes]);

  return (
    <ResizablePanels
      firstPanel={{
        children: (
          <div className="max-width-md w-9/10 service-form-container">
            <TitleBreadcrumb titleLinks={breadcrumb} />
            <div className="m-t-md">
              {addIngestion ? (
                <TestSuiteIngestion
                  testSuite={testSuiteData as TestSuite}
                  onCancel={() => setAddIngestion(false)}
                />
              ) : (
                <Card className="p-xs">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Typography.Paragraph
                        className="tw-heading tw-text-base"
                        data-testid="header">
                        {t('label.add-entity-test', {
                          entity: isColumnFqn
                            ? t('label.column')
                            : t('label.table'),
                        })}
                      </Typography.Paragraph>
                    </Col>
                    <Col span={24}>
                      <IngestionStepper
                        activeStep={activeServiceStep}
                        steps={STEPS_FOR_ADD_TEST_CASE}
                      />
                    </Col>
                    <Col span={24}>{RenderSelectedTab()}</Col>
                  </Row>
                </Card>
              )}
            </div>
          </div>
        ),
        minWidth: 700,
        flex: 0.7,
      }}
      pageTitle={t('label.add-entity', {
        entity: t('label.data-quality-test'),
      })}
      secondPanel={{
        children: (
          <RightPanel
            data={
              addIngestion
                ? INGESTION_DATA
                : addTestSuiteRightPanel(
                    activeServiceStep,
                    isUndefined(table.testSuite),
                    {
                      testCase: testCaseData?.name || '',
                      testSuite: testSuiteData?.name || '',
                    }
                  )
            }
          />
        ),
        className: 'p-md service-doc-panel',
        minWidth: 60,
        overlay: {
          displayThreshold: 200,
          header: t('label.setup-guide'),
          rotation: 'counter-clockwise',
        },
      }}
    />
  );
};

export default AddDataQualityTestV1;
