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

import { Col, Row } from 'antd';
import classNames from 'classnames';
import DocumentTitle from 'components/DocumentTitle/DocumentTitle';
import React, {
  CSSProperties,
  FC,
  Fragment,
  HTMLAttributes,
  ReactNode,
  useMemo,
} from 'react';
import './../../styles/layout/page-layout.less';

interface PageLayoutProp extends HTMLAttributes<HTMLDivElement> {
  leftPanel?: ReactNode;
  header?: ReactNode;
  rightPanel?: ReactNode;
  center?: boolean;
  pageTitle: string;
  rightPanelWidth?: number;
  leftPanelWidth?: number;
}

export const pageContainerStyles: CSSProperties = {
  height: '100%',
  padding: 0,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  overflow: 'hidden',
};

const PageLayoutV1: FC<PageLayoutProp> = ({
  leftPanel,
  children,
  rightPanel,
  className,
  pageTitle,
  header,
  center = false,
  leftPanelWidth = 284,
  rightPanelWidth = 284,
}: PageLayoutProp) => {
  const contentWidth = useMemo(() => {
    if (leftPanel && rightPanel) {
      return `calc(100% - ${leftPanelWidth + rightPanelWidth}px)`;
    } else if (leftPanel) {
      return `calc(100% - ${leftPanelWidth}px)`;
    } else if (rightPanel) {
      return `calc(100% - ${rightPanelWidth}px)`;
    } else {
      return '100%';
    }
  }, [leftPanel, rightPanel, leftPanelWidth, rightPanelWidth]);

  return (
    <Fragment>
      <DocumentTitle title={pageTitle} />
      {header && (
        <div
          className={classNames({
            'header-center': center,
            'm-t-md p-x-md': !center,
          })}>
          {header}
        </div>
      )}
      <Row
        className={className}
        data-testid="page-layout-v1"
        gutter={[0, 16]}
        style={pageContainerStyles}>
        {leftPanel && (
          <Col
            className="page-layout-leftpanel"
            flex={leftPanelWidth + 'px'}
            id="left-panelV1">
            {leftPanel}
          </Col>
        )}
        <Col
          className={classNames(
            'page-layout-v1-center p-y-sm page-layout-v1-vertical-scroll bg-white',
            {
              'flex justify-center': center,
            }
          )}
          flex={contentWidth}
          offset={center ? 3 : 0}
          span={center ? 18 : 24}>
          {children}
        </Col>
        {rightPanel && (
          <Col
            className="page-layout-rightpanel page-layout-v1-vertical-scroll"
            flex={rightPanelWidth + 'px'}
            id="right-panelV1">
            {rightPanel}
          </Col>
        )}
      </Row>
    </Fragment>
  );
};

export default PageLayoutV1;
