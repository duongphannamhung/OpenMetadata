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
import { Button, Menu } from 'antd';
import classNames from 'classnames';
import Loader from 'components/Loader/Loader';
import { TaskTab } from 'components/Task/TaskTab/TaskTab.component';
import { pagingObject } from 'constants/constants';
import { observerOptions } from 'constants/Mydata.constants';
import { EntityTabs, EntityType } from 'enums/entity.enum';
import { FeedFilter } from 'enums/mydata.enum';
import {
  Thread,
  ThreadTaskStatus,
  ThreadType,
} from 'generated/entity/feed/thread';
import { Paging } from 'generated/type/paging';
import { useElementInView } from 'hooks/useElementInView';
import { noop } from 'lodash';
import {
  default as React,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { getCountBadge, getEntityDetailLink } from 'utils/CommonUtils';
import { getEntityField } from 'utils/FeedUtils';
import '../../Widgets/FeedsWidget/feeds-widget.less';
import ActivityFeedEditor from '../ActivityFeedEditor/ActivityFeedEditor';
import ActivityFeedListV1 from '../ActivityFeedList/ActivityFeedListV1.component';
import FeedPanelBodyV1 from '../ActivityFeedPanel/FeedPanelBodyV1';
import FeedPanelHeader from '../ActivityFeedPanel/FeedPanelHeader';
import { useActivityFeedProvider } from '../ActivityFeedProvider/ActivityFeedProvider';
import './activity-feed-tab.less';
import {
  ActivityFeedTabProps,
  ActivityFeedTabs,
} from './ActivityFeedTab.interface';
import { ReactComponent as TaskCloseIcon } from '/assets/svg/ic-close-task.svg';
import { ReactComponent as TaskIcon } from '/assets/svg/ic-task.svg';

export const ActivityFeedTab = ({
  count,
  taskCount,
  fqn,
  owner,
  tags,
  description,
  columns,
  entityType,
}: ActivityFeedTabProps) => {
  const [paging] = useState<Paging>(pagingObject);
  const history = useHistory();
  const { t } = useTranslation();
  const [elementRef, isInView] = useElementInView(observerOptions);
  const { subTab: activeTab = 'all' } =
    useParams<{ subTab: ActivityFeedTabs }>();
  const [taskFilter, setTaskFilter] = useState<'open' | 'close'>('open');

  const handleTabChange = (subTab: string) => {
    history.push(
      getEntityDetailLink(entityType, fqn, EntityTabs.ACTIVITY_FEED, subTab)
    );
  };

  const {
    postFeed,
    selectedThread,
    setActiveThread,
    entityThread,
    getFeedData,
    loading,
  } = useActivityFeedProvider();

  const { feedFilter, threadType } = useMemo(() => {
    return {
      threadType:
        activeTab === 'tasks' ? ThreadType.Task : ThreadType.Conversation,
      feedFilter: activeTab === 'mentions' ? FeedFilter.MENTIONS : undefined,
    };
  }, [activeTab]);

  const handleFeedFetchFromFeedList = useCallback(
    (after?: string) => {
      getFeedData(feedFilter, after, threadType, entityType, fqn);
    },
    [threadType, feedFilter]
  );

  useEffect(() => {
    getFeedData(feedFilter, undefined, threadType, entityType, fqn);
  }, [feedFilter, threadType]);

  const handleFeedClick = useCallback(
    (feed: Thread) => {
      setActiveThread(feed);
    },
    [setActiveThread]
  );

  const fetchMoreThread = (
    isElementInView: boolean,
    pagingObj: Paging,
    isLoading: boolean
  ) => {
    if (isElementInView && pagingObj?.after && !isLoading) {
      handleFeedFetchFromFeedList(pagingObj.after);
    }
  };

  useEffect(() => {
    fetchMoreThread(isInView, paging, loading);
  }, [paging, loading, isInView]);

  const loader = useMemo(() => (loading ? <Loader /> : null), [loading]);

  const onSave = (message: string) => {
    postFeed(message, selectedThread?.id ?? '').catch(() => {
      // ignore since error is displayed in toast in the parent promise.
      // Added block for sonar code smell
    });
  };

  const entityField = selectedThread
    ? getEntityField(selectedThread.about)
    : '';

  const threads = useMemo(() => {
    if (activeTab === ActivityFeedTabs.TASKS) {
      return entityThread.filter(
        (thread) =>
          taskFilter === 'open'
            ? thread.task?.status === ThreadTaskStatus.Open
            : thread.task?.status === ThreadTaskStatus.Closed,
        []
      );
    }

    return entityThread;
  }, [activeTab, entityThread, taskFilter]);

  const [openTasks, closedTasks] = useMemo(() => {
    if (activeTab === ActivityFeedTabs.TASKS) {
      return entityThread.reduce(
        (acc, curr) => {
          if (curr.task?.status === ThreadTaskStatus.Open) {
            acc[0] = acc[0] + 1;
          } else {
            acc[1] = acc[1] + 1;
          }

          return acc;
        },
        [0, 0]
      );
    }

    return [0, 0];
  }, [entityThread, activeTab]);

  return (
    <div className="d-flex h-full overflow-hidden">
      <Menu
        className="custom-menu w-72 p-t-sm"
        data-testid="global-setting-left-panel"
        items={[
          {
            label: (
              <div className="d-flex justify-between">
                <span className="font-normal">{t('label.all')}</span>
                <span>{getCountBadge(count)}</span>
              </div>
            ),
            key: 'all',
          },
          {
            label: (
              <div className="d-flex justify-between">
                <span className="font-normal">{t('label.mention-plural')}</span>
              </div>
            ),
            key: 'mentions',
          },
          {
            label: (
              <div className="d-flex justify-between">
                <span className="font-normal">{t('label.task-plural')}</span>
                <span>{getCountBadge(taskCount)}</span>
              </div>
            ),
            key: 'tasks',
          },
        ]}
        mode="inline"
        selectedKeys={[activeTab]}
        style={{
          flex: '0 0 250px',
          borderRight: '1px solid rgba(0, 0, 0, 0.1)',
        }}
        onClick={(info) => handleTabChange(info.key)}
      />

      <div style={{ flex: '0 0 calc(50% - 125px)' }}>
        {activeTab === ActivityFeedTabs.TASKS && (
          <div
            className="d-flex gap-2 p-sm"
            style={{ backgroundColor: '#F8F8F8' }}>
            <Button
              className={classNames('d-flex  no-border', {
                'text-medium': taskFilter === 'open',
              })}
              icon={<TaskIcon className="m-r-xss" width={14} />}
              key="open"
              type="ghost"
              onClick={() => setTaskFilter('open')}>
              {openTasks} {t('label.open')}
            </Button>
            <Button
              className={classNames('d-flex  no-border', {
                'text-medium': taskFilter === 'close',
              })}
              icon={<TaskCloseIcon className="m-r-xss" width={14} />}
              key="close"
              type="ghost"
              onClick={() => setTaskFilter('close')}>
              {closedTasks} {t('label.close')}
            </Button>
          </div>
        )}
        <ActivityFeedListV1
          hidePopover
          activeFeedId={selectedThread?.id}
          feedList={threads}
          isLoading={loading}
          showThread={false}
          onFeedClick={handleFeedClick}
        />
      </div>
      <div
        style={{
          flex: '0 0 calc(50% - 125px)',
          borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
        }}>
        {loading && loader}
        {selectedThread &&
          !loading &&
          (activeTab !== ActivityFeedTabs.TASKS ? (
            <div id="feed-panel">
              <div className="feed-explore-heading">
                <FeedPanelHeader
                  hideCloseIcon
                  className="p-x-md"
                  entityFQN={fqn}
                  entityField={entityField as string}
                  threadType={selectedThread?.type ?? ThreadType.Conversation}
                  onCancel={noop}
                />
              </div>
              <FeedPanelBodyV1
                showThread
                feed={selectedThread}
                hidePopover={false}
              />
              <ActivityFeedEditor onSave={onSave} />
            </div>
          ) : (
            <div id="task-panel">
              {entityType === EntityType.TABLE ? (
                <TaskTab
                  columns={columns}
                  description={description}
                  entityType={EntityType.TABLE}
                  owner={owner}
                  tags={tags}
                  task={selectedThread}
                />
              ) : (
                <TaskTab
                  description={description}
                  entityType={entityType}
                  owner={owner}
                  tags={tags}
                  task={selectedThread}
                />
              )}
            </div>
          ))}
      </div>
      <div
        className="w-full"
        data-testid="observer-element"
        id="observer-element"
        ref={elementRef as RefObject<HTMLDivElement>}
      />
      {loader}
    </div>
  );
};
