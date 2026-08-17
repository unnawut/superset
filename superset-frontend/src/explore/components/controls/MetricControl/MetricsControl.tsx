/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ensureIsArray, usePrevious, type Metric } from '@superset-ui/core';
import { t } from '@apache-superset/core/translation';
import { isEqual } from 'lodash-es';
import ControlHeader from 'src/explore/components/ControlHeader';
import { Icons } from '@superset-ui/core/components/Icons';
import {
  AddIconButton,
  AddControlLabel,
  HeaderContainer,
  LabelsContainer,
} from 'src/explore/components/controls/OptionControls';
import MetricDefinitionValue from './MetricDefinitionValue';
import AdhocMetric, {
  dedupeAdhocMetricOptionName,
  type AdhocMetricInput,
} from './AdhocMetric';
import AdhocMetricPopoverTrigger, {
  type AdhocMetricPopoverTriggerProps,
} from './AdhocMetricPopoverTrigger';
import type { savedMetricType } from './types';

type ColumnsProp = AdhocMetricPopoverTriggerProps['columns'];
type DatasourceProp = AdhocMetricPopoverTriggerProps['datasource'];

// A control value is either a saved metric name, a saved metric, an AdhocMetric
// instance or the plain dictionary an adhoc metric is persisted as.
type MetricValue =
  | string
  | savedMetricType
  | Metric
  | AdhocMetric
  | AdhocMetricInput;

function hasProperty<K extends string>(
  value: unknown,
  key: K,
): value is Record<K, unknown> {
  return typeof value === 'object' && value !== null && key in value;
}

function getSavedMetricName(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (
    hasProperty(value, 'metric_name') &&
    typeof value.metric_name === 'string'
  ) {
    return value.metric_name;
  }
  return undefined;
}

function getOptionName(value: unknown): string | undefined {
  if (
    hasProperty(value, 'optionName') &&
    typeof value.optionName === 'string'
  ) {
    return value.optionName;
  }
  return undefined;
}

function getColumnName(value: unknown): string | undefined {
  if (
    hasProperty(value, 'column_name') &&
    typeof value.column_name === 'string'
  ) {
    return value.column_name;
  }
  return undefined;
}

// wrapped so a metric without a column can be told apart from one whose column
// carries no name
function getMetricColumn(
  metric: unknown,
): { name: string | undefined } | undefined {
  if (hasProperty(metric, 'column') && metric.column) {
    return { name: getColumnName(metric.column) };
  }
  return undefined;
}

function getOptionsForSavedMetrics(
  savedMetrics: savedMetricType[] | undefined,
  currentMetricValues: unknown,
  currentMetric: unknown,
): savedMetricType[] {
  return (
    savedMetrics?.filter(savedMetric =>
      Array.isArray(currentMetricValues)
        ? !currentMetricValues.includes(savedMetric.metric_name) ||
          savedMetric.metric_name === currentMetric
        : savedMetric,
    ) ?? []
  );
}

function isDictionaryForAdhocMetric(value: unknown): value is AdhocMetricInput {
  return (
    hasProperty(value, 'expressionType') &&
    !(value instanceof AdhocMetric) &&
    Boolean(value.expressionType)
  );
}

// adhoc metrics are stored as dictionaries in URL params. We convert them back into the
// AdhocMetric class for typechecking, consistency and instance method access.
function coerceAdhocMetrics(value: unknown): MetricValue[] {
  if (!value) {
    return [];
  }
  if (!Array.isArray(value)) {
    if (isDictionaryForAdhocMetric(value)) {
      return [new AdhocMetric(value)];
    }
    return [value as MetricValue];
  }
  // Metrics are identified by optionName when editing; regenerate any that
  // collide so each keeps a unique identity (see dedupeAdhocMetricOptionName).
  const seenOptionNames = new Set<string>();
  return (value as MetricValue[]).map(val => {
    if (isDictionaryForAdhocMetric(val)) {
      return dedupeAdhocMetricOptionName(new AdhocMetric(val), seenOptionNames);
    }
    return val;
  });
}

const emptySavedMetric = { metric_name: '', expression: '' };

const getMetricsMatchingCurrentDataset = (
  value: unknown,
  columns: unknown[] | undefined,
  savedMetrics: savedMetricType[] | undefined,
) =>
  ensureIsArray(value).filter(metric => {
    const savedMetricName = getSavedMetricName(metric);
    if (savedMetricName !== undefined) {
      return savedMetrics?.some(
        savedMetric => savedMetric.metric_name === savedMetricName,
      );
    }
    const metricColumn = getMetricColumn(metric);
    return columns?.some(
      column => !metricColumn || metricColumn.name === getColumnName(column),
    );
  });

export interface MetricsControlProps {
  name: string;
  onChange: (value: unknown) => void;
  multi?: boolean;
  value?: unknown;
  columns?: unknown[];
  savedMetrics?: savedMetricType[];
  datasource?: unknown;
  clearable?: boolean;
  isLoading?: boolean;
  [key: string]: unknown;
}

const MetricsControl = ({
  onChange = () => {},
  multi,
  value: propsValue,
  columns = [],
  savedMetrics = [],
  datasource,
  ...props
}: MetricsControlProps) => {
  const [value, setValue] = useState(coerceAdhocMetrics(propsValue));
  const prevColumns = usePrevious(columns);
  const prevSavedMetrics = usePrevious(savedMetrics);

  const handleChange = useCallback(
    (opts: unknown) => {
      // if clear out options
      if (opts === null) {
        onChange(null);
        return;
      }

      const transformedOpts = ensureIsArray(opts);
      const optionValues = transformedOpts
        .map(option => {
          // pre-defined metric
          if (hasProperty(option, 'metric_name') && option.metric_name) {
            return option.metric_name;
          }
          return option;
        })
        .filter((option: unknown) => option);
      onChange(multi ? optionValues : optionValues[0]);
    },
    [multi, onChange],
  );

  const onNewMetric = useCallback(
    (newMetric: Metric) => {
      const newValue = [...value, newMetric];
      setValue(newValue);
      handleChange(newValue);
    },
    [handleChange, value],
  );

  const onMetricEdit = useCallback(
    (changedMetric: Metric, oldMetric: Metric) => {
      const oldOptionName = getOptionName(oldMetric);
      const newValue = value.map(val => {
        const optionName = getOptionName(val);
        // saved metrics are compared by name, adhoc metrics by optionName
        if (val === oldMetric.metric_name || optionName !== undefined) {
          return optionName === oldOptionName ? changedMetric : val;
        }
        return val;
      });
      setValue(newValue);
      handleChange(newValue);
    },
    [handleChange, value],
  );

  const onRemoveMetric = useCallback(
    (index: number) => {
      if (!Array.isArray(value)) {
        return;
      }
      const valuesCopy = [...value];
      valuesCopy.splice(index, 1);
      setValue(valuesCopy);
      handleChange(valuesCopy);
    },
    [handleChange, value],
  );

  const moveLabel = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const newValues = [...value];
      [newValues[hoverIndex], newValues[dragIndex]] = [
        newValues[dragIndex],
        newValues[hoverIndex],
      ];
      setValue(newValues);
    },
    [value],
  );

  const isAddNewMetricDisabled = useCallback(
    () => !multi && value.length > 0,
    [multi, value.length],
  );

  const savedMetricOptions = useMemo(
    () => getOptionsForSavedMetrics(savedMetrics, propsValue, null),
    [propsValue, savedMetrics],
  );

  const newAdhocMetric = useMemo(() => new AdhocMetric({}), [value]);
  const addNewMetricPopoverTrigger = useCallback(
    (trigger: React.ReactNode) => {
      if (isAddNewMetricDisabled()) {
        return trigger;
      }
      return (
        <AdhocMetricPopoverTrigger
          adhocMetric={newAdhocMetric}
          onMetricEdit={onNewMetric}
          columns={columns as ColumnsProp}
          savedMetricsOptions={savedMetricOptions}
          savedMetric={emptySavedMetric}
          datasource={datasource as DatasourceProp}
          isNew
        >
          {trigger}
        </AdhocMetricPopoverTrigger>
      );
    },
    [
      columns,
      datasource,
      isAddNewMetricDisabled,
      newAdhocMetric,
      onNewMetric,
      savedMetricOptions,
    ],
  );

  useEffect(() => {
    // Remove selected custom metrics that do not exist in the dataset anymore
    // Remove selected adhoc metrics that use columns which do not exist in the dataset anymore
    if (
      propsValue &&
      (!isEqual(prevColumns, columns) ||
        !isEqual(prevSavedMetrics, savedMetrics))
    ) {
      const matchingMetrics = getMetricsMatchingCurrentDataset(
        propsValue,
        columns,
        savedMetrics,
      );
      if (!isEqual(matchingMetrics, propsValue)) {
        handleChange(matchingMetrics);
      }
    }
  }, [columns, handleChange, savedMetrics]);

  useEffect(() => {
    setValue(coerceAdhocMetrics(propsValue));
  }, [propsValue]);

  const onDropLabel = useCallback(
    () => handleChange(value),
    [handleChange, value],
  );

  const valueRenderer = useCallback(
    (option: unknown, index: number) => (
      <MetricDefinitionValue
        key={index}
        index={index}
        option={option as AdhocMetric | savedMetricType | string}
        onMetricEdit={onMetricEdit}
        onRemoveMetric={onRemoveMetric}
        columns={columns as ColumnsProp}
        datasource={datasource as DatasourceProp}
        savedMetrics={savedMetrics}
        savedMetricsOptions={getOptionsForSavedMetrics(
          savedMetrics,
          value,
          value?.[index],
        )}
        onMoveLabel={moveLabel}
        onDropLabel={onDropLabel}
        multi={multi}
      />
    ),
    [
      columns,
      datasource,
      moveLabel,
      multi,
      onDropLabel,
      onMetricEdit,
      onRemoveMetric,
      savedMetrics,
      value,
    ],
  );

  return (
    <div className="metrics-select">
      <HeaderContainer>
        <ControlHeader {...props} />
        {addNewMetricPopoverTrigger(
          <AddIconButton
            disabled={isAddNewMetricDisabled()}
            data-test="add-metric-button"
          >
            <Icons.PlusOutlined iconSize="m" />
          </AddIconButton>,
        )}
      </HeaderContainer>
      <LabelsContainer>
        {value.length > 0
          ? value.map((value, index) => valueRenderer(value, index))
          : addNewMetricPopoverTrigger(
              <AddControlLabel>
                <Icons.PlusOutlined iconSize="m" />
                {t('Add metric')}
              </AddControlLabel>,
            )}
      </LabelsContainer>
    </div>
  );
};

// Was a PureComponent before the FC conversion; preserve shallow-equal skip.
export default memo(MetricsControl);
