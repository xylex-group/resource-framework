# Edit State

Edit state management for resource modifications.

## Basic Edit Mode

```typescript
import { useEditState } from '@/packages/resource-framework/hooks/useEditState';

function ResourceForm() {
  const {
    isEditing,
    originalData,
    editedData,
    changes,
    setField,
    revert,
    submit
  } = useEditState(initialData);

  return (
    <>
      <input
        value={editedData.name}
        onChange={(e) => setField('name', e.target.value)}
      />
      <button onClick={() => revert()}>Cancel</button>
      <button onClick={() => submit()}>Save</button>
    </>
  );
}
```

## Change Detection

```typescript
const {
  changes,           // { field_name: new_value }
  hasChanges,        // boolean
  changedFields      // string[]
} = useEditState(data);

if (!hasChanges) {
  return <div>No changes</div>;
}
```

## Dirty State

```typescript
function Form() {
  const { isDirty } = useEditState(data);

  // Warn user before leaving
  useEffect(() => {
    if (isDirty) {
      window.addEventListener('beforeunload', preventDefault);
      return () => window.removeEventListener('beforeunload', preventDefault);
    }
  }, [isDirty]);

  return <div>Form</div>;
}
```

## Undo/Redo

```typescript
const {
  undo,
  redo,
  canUndo,
  canRedo
} = useEditState(data);

return (
  <>
    <button disabled={!canUndo} onClick={undo}>Undo</button>
    <button disabled={!canRedo} onClick={redo}>Redo</button>
  </>
);
```

## Validation

```typescript
const {
  errors,
  validate,
  isValid
} = useEditState(data, {
  validatorFn: (data) => {
    const errs = {};
    if (!data.name) errs.name = 'Required';
    if (data.email && !isValidEmail(data.email)) {
      errs.email = 'Invalid email';
    }
    return errs;
  }
});

const handleSubmit = async () => {
  if (!validate()) return;
  await submit();
};
```

## Field-level Changes

```typescript
const { isFieldDirty, fieldErrors } = useEditState(data);

return (
  <div>
    <input {...bindField('name')} />
    {isFieldDirty('name') && <span>*</span>}
    {fieldErrors.name && <span>{fieldErrors.name}</span>}
  </div>
);
```

## Reset with New Data

```typescript
const { reset } = useEditState(data);

useEffect(() => {
  // Reset when data prop changes
  reset(newData);
}, [newData, reset]);
```

## Complex Objects

```typescript
const { setNestedField } = useEditState(data);

// Update nested property
setNestedField(['address', 'city'], 'New York');

// Update array element
setNestedField(['phones', 0, 'number'], '555-1234');
```

## See Also

- [Resource Provider](./13-resource-provider.md)
- [Components](./06-components.md)
