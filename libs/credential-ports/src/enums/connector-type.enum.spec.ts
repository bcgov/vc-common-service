import { ConnectorType } from './connector-type.enum';

describe('ConnectorType', () => {
  it('should expose stable connector string values', () => {
    expect(ConnectorType.Traction).toBe('traction');
    expect(ConnectorType.Credo).toBe('credo');
  });
});
