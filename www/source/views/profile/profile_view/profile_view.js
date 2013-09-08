RAD.view("view.profile_view", RAD.Blanks.View.extend({
    url :  'source/views/profile/profile_view/profile_view.html',
    children : [
        {
            container_id: '.bio_check',
            content: 'view.bio_edge_checker'
        }
    ]
}));