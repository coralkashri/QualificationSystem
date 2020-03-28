exports.min_access_required = {
    view_projects: 1,
    view_profile: 1,
    modify_current_user: 1,
    view_admin_panel: 2,
    view_users_details: 2,
    create_new_user_with_specific_role: 2,
    modify_all_users: 2,
    delete_different_users: 2,
    delete_all_users: 2, // Delete all users in one shot -- Recreate admin user (admin@admin)
    create_topic: 2,
    modify_topic: 2,
    delete_topic: 2,
    create_tasks: 2,
    delete_tasks: 2,
    modify_tasks: 2,
    create_plans: 2,
    modify_plans: 2,
    delete_plans: 2
};