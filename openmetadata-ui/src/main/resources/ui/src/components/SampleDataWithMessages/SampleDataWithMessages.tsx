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

import { Col, Row, Typography } from 'antd';
import Loader from 'components/Loader/Loader';
import { EntityType } from 'enums/entity.enum';
import { SearchIndexSampleData } from 'generated/entity/data/searchIndex';
import { isUndefined } from 'lodash';
import React, { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSampleDataBySearchIndexId } from 'rest/SearchIndexAPI';
import { getSampleDataByTopicId } from 'rest/topicsAPI';
import { Transi18next } from 'utils/CommonUtils';
import { WORKFLOWS_METADATA_DOCS } from '../../constants/docs.constants';
import { TopicSampleData } from '../../generated/entity/data/topic';
import ErrorPlaceHolder from '../common/error-with-placeholder/ErrorPlaceHolder';
import MessageCard from './MessageCard';

const SampleDataWithMessages: FC<{
  entityId: string;
  entityType: EntityType;
}> = ({ entityId, entityType }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<TopicSampleData | SearchIndexSampleData>();
  const [loading, setLoading] = useState(false);

  const fetchEntitySampleData = async () => {
    setLoading(true);
    try {
      const { sampleData } =
        entityType === EntityType.TOPIC
          ? await getSampleDataByTopicId(entityId)
          : await getSampleDataBySearchIndexId(entityId);

      setData(sampleData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntitySampleData();
  }, [entityId]);

  if (loading) {
    return <Loader />;
  }

  if (isUndefined(data)) {
    return (
      <div className="m-t-xlg" data-testid="no-data">
        <ErrorPlaceHolder>
          <Typography.Paragraph>
            <Transi18next
              i18nKey="message.view-sample-data-entity"
              renderElement={
                <a
                  href={WORKFLOWS_METADATA_DOCS}
                  rel="noreferrer"
                  style={{ color: '#1890ff' }}
                  target="_blank"
                />
              }
              values={{
                entity: t('label.metadata-ingestion'),
              }}
            />
          </Typography.Paragraph>
        </ErrorPlaceHolder>
      </div>
    );
  }

  return (
    <Row className="p-md" gutter={[16, 16]}>
      {data.messages?.map((message) => (
        <Col key={message} span={24}>
          <MessageCard message={message} />
        </Col>
      ))}
    </Row>
  );
};

export default SampleDataWithMessages;
