exports.min_access_required = {
    view_projects: 1,
    view_profile: 1,
    modify_current_user: 1,
    upload_files: 1,
    view_admin_panel: 2,
    view_users_details: 2,
    create_new_user_with_specific_role: 2,
    modify_all_users: 2,
    register_other_users_to_plans: 2,
    manage_other_users_plans: 2,
    delete_different_users: 2,
    delete_all_users: 2, // Delete all users in one shot -- Recreate admin user (admin@admin)
    create_topic: 2,
    modify_topic: 2,
    delete_topic: 2,
    archive_topics: 2,
    view_archived_topics: 2,
    create_tasks: 2,
    delete_tasks: 2,
    modify_tasks: 2,
    create_plans: 2,
    modify_plans: 2,
    delete_plans: 2,
    archive_plans: 2,
    view_archived_plans: 2,
    watch_unregistered_plans: 2,
    skip_tasks: 2
};

exports.roles = {
    admin: 3,
    manager: 2,
    user: 1,
    banned: 0
};