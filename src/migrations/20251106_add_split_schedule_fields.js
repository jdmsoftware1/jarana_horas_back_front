export async function up(queryInterface, Sequelize) {
  // Add split schedule fields to schedule_template_days
  await queryInterface.addColumn('schedule_template_days', 'is_split_schedule', {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  });

  await queryInterface.addColumn('schedule_template_days', 'morning_start', {
    type: Sequelize.TIME,
    allowNull: true
  });

  await queryInterface.addColumn('schedule_template_days', 'morning_end', {
    type: Sequelize.TIME,
    allowNull: true
  });

  await queryInterface.addColumn('schedule_template_days', 'afternoon_start', {
    type: Sequelize.TIME,
    allowNull: true
  });

  await queryInterface.addColumn('schedule_template_days', 'afternoon_end', {
    type: Sequelize.TIME,
    allowNull: true
  });

  // Make start_time and end_time nullable for split schedules
  await queryInterface.changeColumn('schedule_template_days', 'start_time', {
    type: Sequelize.TIME,
    allowNull: true
  });

  await queryInterface.changeColumn('schedule_template_days', 'end_time', {
    type: Sequelize.TIME,
    allowNull: true
  });
}

export async function down(queryInterface, Sequelize) {
  // Remove split schedule fields
  await queryInterface.removeColumn('schedule_template_days', 'is_split_schedule');
  await queryInterface.removeColumn('schedule_template_days', 'morning_start');
  await queryInterface.removeColumn('schedule_template_days', 'morning_end');
  await queryInterface.removeColumn('schedule_template_days', 'afternoon_start');
  await queryInterface.removeColumn('schedule_template_days', 'afternoon_end');

  // Restore start_time and end_time as not nullable
  await queryInterface.changeColumn('schedule_template_days', 'start_time', {
    type: Sequelize.TIME,
    allowNull: false
  });

  await queryInterface.changeColumn('schedule_template_days', 'end_time', {
    type: Sequelize.TIME,
    allowNull: false
  });
}
