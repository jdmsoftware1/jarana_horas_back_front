import React from 'react';
import Layout from '../../components/Layout';
import EmployeeCalendar from '../../components/EmployeeCalendar';

const CalendarPage = () => {
  return (
    <Layout isAdmin={false}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-dark font-serif">
              Mi Calendario
            </h1>
            <p className="text-brand-medium mt-2">
              Visualiza tus días festivos, vacaciones y ausencias
            </p>
          </div>
          
          <EmployeeCalendar />
        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
