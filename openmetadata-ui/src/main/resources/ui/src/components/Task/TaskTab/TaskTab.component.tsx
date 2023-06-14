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
import Icon from '@ant-design/icons';
import { Button, Col, Form, Row, Space, Typography } from 'antd';
import AppState from 'AppState';
import { AxiosError } from 'axios';
import ActivityFeedCardV1 from 'components/ActivityFeed/ActivityFeedCard/ActivityFeedCardV1';
import ActivityFeedEditor from 'components/ActivityFeed/ActivityFeedEditor/ActivityFeedEditor';
import { useActivityFeedProvider } from 'components/ActivityFeed/ActivityFeedProvider/ActivityFeedProvider';
import { OwnerLabel } from 'components/common/OwnerLabel/OwnerLabel.component';
import EntityPopOverCard from 'components/common/PopOverCard/EntityPopOverCard';
import { FQN_SEPARATOR_CHAR } from 'constants/char.constants';
import { TaskOperation } from 'constants/Feeds.constants';
import { TaskType } from 'generated/api/feed/createThread';
import { TaskDetails, ThreadTaskStatus } from 'generated/entity/feed/thread';
import { useAuth } from 'hooks/authHooks';
import { isEmpty, isEqual, isUndefined, noop } from 'lodash';
import ClosedTask from 'pages/TasksPage/shared/ClosedTask';
import DescriptionTask from 'pages/TasksPage/shared/DescriptionTask';
import TagsTask from 'pages/TasksPage/shared/TagsTask';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory } from 'react-router-dom';
import { updateTask } from 'rest/feedsAPI';
import { ENTITY_LINK_SEPARATOR } from 'utils/EntityUtils';
import {
  entityDisplayName,
  getEntityField,
  getEntityFQN,
  prepareFeedLink,
} from 'utils/FeedUtils';
import { getEntityLink } from 'utils/TableUtils';
import {
  getColumnObject,
  isDescriptionTask,
  isTagsTask,
} from 'utils/TasksUtils';
import { showErrorToast, showSuccessToast } from 'utils/ToastUtils';
import { TaskTabProps } from './TaskTab.interface';
import { ReactComponent as TaskCloseIcon } from '/assets/svg/ic-close-task.svg';
import { ReactComponent as TaskOpenIcon } from '/assets/svg/ic-open-task.svg';

export const TaskTab = ({
  task,
  owner,
  entityType,
  tags,
  description,
  ...rest
}: TaskTabProps) => {
  const { task: taskDetails } = task;
  const entityFQN = getEntityFQN(task.about) ?? '';
  const entityCheck = !isUndefined(entityFQN) && !isUndefined(entityType);
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const history = useHistory();
  const { isAdminUser } = useAuth();
  const { postFeed } = useActivityFeedProvider();

  const isTaskClosed = isEqual(taskDetails?.status, ThreadTaskStatus.Closed);

  // get current user details
  const currentUser = useMemo(
    () => AppState.getCurrentUserDetails(),
    [AppState.userDetails, AppState.nonSecureUserDetails]
  );

  const entityField = useMemo(() => {
    return getEntityField(task.about);
  }, [task]);

  const columnObject = useMemo(() => {
    // prepare column from entityField
    const column = entityField?.split(ENTITY_LINK_SEPARATOR)?.slice(-2)?.[0];

    // prepare column value by replacing double quotes
    const columnValue = column?.replaceAll(/^"|"$/g, '') || '';

    /**
     * Get column name by spliting columnValue with FQN Separator
     */
    const columnName = columnValue.split(FQN_SEPARATOR_CHAR).pop();

    return getColumnObject(columnName ?? '', rest.columns || []);
  }, [task, rest.columns]);

  const isOwner = isEqual(owner?.id, currentUser?.id);
  const isCreator = isEqual(task.createdBy, currentUser?.name);

  const checkIfUserPartOfTeam = useCallback(
    (teamId: string): boolean => {
      return Boolean(currentUser?.teams?.find((team) => teamId === team.id));
    },
    [currentUser]
  );

  const isAssignee = taskDetails?.assignees?.some((assignee) =>
    isEqual(assignee.id, currentUser?.id)
  );

  const isPartOfAssigneeTeam = taskDetails?.assignees?.some((assignee) =>
    assignee.type === 'team' ? checkIfUserPartOfTeam(assignee.id) : false
  );

  const isTaskDescription = isDescriptionTask(taskDetails?.type as TaskType);

  const isTaskTags = isTagsTask(taskDetails?.type as TaskType);

  const getTaskLinkElement = entityCheck && (
    <Typography.Text>
      <span>{`#${taskDetails?.id} `}</span>

      <Typography.Text>{taskDetails?.type}</Typography.Text>
      <span className="m-x-xss">{t('label.for-lowercase')}</span>
      <>
        <span className="p-r-xss">{entityType}</span>
        <EntityPopOverCard entityFQN={entityFQN} entityType={entityType}>
          <Link
            className="break-all"
            data-testid="entitylink"
            to={prepareFeedLink(entityType, entityFQN)}
            onClick={(e) => e.stopPropagation()}>
            {entityDisplayName(entityType, entityFQN)}
          </Link>
        </EntityPopOverCard>
      </>
    </Typography.Text>
  );

  const updateTaskData = (data: TaskDetails) => {
    if (!taskDetails?.id) {
      return;
    }
    updateTask(TaskOperation.RESOLVE, taskDetails?.id + '', data)
      .then(() => {
        showSuccessToast(t('server.task-resolved-successfully'));
        history.push(getEntityLink(entityType ?? '', entityFQN ?? ''));
      })
      .catch((err: AxiosError) => showErrorToast(err));
  };

  const onTaskResolve = () => {
    if (isTaskTags) {
      const tagsData = {
        newValue: taskDetails?.suggestion || '[]',
      };

      updateTaskData(tagsData as TaskDetails);
    } else {
      const data = { newValue: taskDetails?.suggestion };
      updateTaskData(data as TaskDetails);
    }
  };

  /**
   *
   * @returns True if has access otherwise false
   */
  const hasEditAccess = () => isAdminUser || isAssignee || isOwner;

  const hasTaskUpdateAccess = () => hasEditAccess() || isPartOfAssigneeTeam;

  // prepare current tags for update tags task
  const getCurrentTags = () => {
    if (!isEmpty(columnObject) && entityField) {
      return columnObject.tags ?? [];
    } else {
      return tags ?? [];
    }
  };

  // prepare current description for update description task
  const currentDescription = () => {
    if (entityField && !isEmpty(columnObject)) {
      return columnObject.description || '';
    } else {
      return description || '';
    }
  };

  const onSave = (message: string) => {
    postFeed(message, task?.id ?? '').catch(() => {
      // ignore since error is displayed in toast in the parent promise.
      // Added block for sonar code smell
    });
  };

  useEffect(() => {
    form.setFieldValue('description', currentDescription());
  }, [columnObject, entityField, currentDescription]);

  return (
    <div className="p-sm">
      <Row gutter={[0, 24]}>
        <Col className="d-flex items-center" span={24}>
          <Icon
            className="m-r-xs"
            component={
              taskDetails?.status === ThreadTaskStatus.Open
                ? TaskOpenIcon
                : TaskCloseIcon
            }
            style={{ fontSize: '18px' }}
          />

          {getTaskLinkElement}
        </Col>
        <Col span={24}>
          <Typography.Text className="text-grey-muted">
            {t('label.assignee-plural')}:{' '}
          </Typography.Text>

          <OwnerLabel
            hasPermission={false}
            owner={taskDetails?.assignees[0]}
            onUpdate={noop}
          />
          <Typography.Text className="text-grey-muted">
            {t('label.created-by')}:{' '}
          </Typography.Text>
          <OwnerLabel
            hasPermission={false}
            owner={{ name: task.createdBy, type: 'user', id: '' }}
            onUpdate={noop}
          />
        </Col>
        <Col span={24}>
          {isTaskDescription && (
            <DescriptionTask
              hasEditAccess={hasEditAccess()}
              isTaskActionEdit={false}
              suggestion={task.task?.suggestion ?? ''}
              taskDetail={task}
              value={currentDescription()}
              onChange={(value) => form.setFieldValue('description', value)}
            />
          )}

          {isTaskTags && (
            <TagsTask
              currentTags={getCurrentTags()}
              hasEditAccess={hasEditAccess()}
              isTaskActionEdit={false}
              task={taskDetails}
              value={
                form.getFieldValue('updateTags') ??
                JSON.stringify(task.task?.suggestion) ??
                '[]'
              }
              onChange={(newTags) => form.setFieldValue('updateTags', newTags)}
            />
          )}

          {task?.posts?.map((reply) => (
            <ActivityFeedCardV1
              isPost
              feed={task}
              hidePopover={false}
              key={reply.id}
              post={reply}
            />
          ))}
          <ActivityFeedEditor onSave={onSave} />

          <Space
            className="m-t-sm items-end w-full"
            data-testid="task-cta-buttons"
            size="small">
            {(hasTaskUpdateAccess() || isCreator) && !isTaskClosed && (
              <Button onClick={noop}>{t('label.close')}</Button>
            )}

            {isTaskClosed ? (
              <ClosedTask task={taskDetails} />
            ) : (
              <Button
                className="ant-btn-primary-custom"
                type="primary"
                onClick={onTaskResolve}>
                {t('label.accept')}
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};
