import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bg }) => {
  return (
    <div className="bg-card-light dark:bg-card-dark p-4 rounded-[20px] shadow-soft flex items-center transition-all hover:scale-[1.02]">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${bg || 'bg-background-light dark:bg-background-dark'}`}
      >
        <span className={`material-icons-round text-${color} text-2xl`}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-text-secondary-light font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-text-primary-light dark:text-white">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
