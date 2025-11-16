
interface TimeFilterProps {
  selectedTimePeriod: string;
  onSelectTimePeriod: (filter: string) => void;
}

export function TimeFilter({ selectedTimePeriod, onSelectTimePeriod }: TimeFilterProps) {


  return (
    <s-stack direction="inline" gap="small">
      <s-button 
        icon="calendar"
        onClick={() => onSelectTimePeriod('7')}      
      >
        <s-text type={selectedTimePeriod === '7' ? 'strong' : 'generic'}>
          Last 7 days
        </s-text>
      </s-button>
      <s-button 
        icon="calendar"
        onClick={() => onSelectTimePeriod('30')}
      >
        <s-text type={selectedTimePeriod === '30' ? 'strong' : 'generic'}>
          Last 30 days
        </s-text>
      </s-button>
      <s-button 
        icon="calendar"
        onClick={() => onSelectTimePeriod('all')}
      >
        <s-text type={selectedTimePeriod === 'all' ? 'strong' : 'generic'}>
          Entire Period
        </s-text>
      </s-button>
    </s-stack>
  )
}
