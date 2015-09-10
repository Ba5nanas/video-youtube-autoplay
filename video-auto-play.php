<?php
/**
 * Plugin Name: Video Auto Play
 * Plugin URI:
 * Description: This is plugins ready embed youtube wordpress ( youtube only )
 * Version: 1.0.0
 * Author: Ba5nanas
 * Author URI: http://themeforest.net/user/ba5nanas
 * License: GPL2
 */

 function add_script_js() {
  wp_enqueue_script( 'vimeo-api', 'https://f.vimeocdn.com/js/froogaloop2.min.js' , array('jquery'));
  wp_enqueue_script( 'jquery-iframe', plugin_dir_url( __FILE__ ) . 'assets/js/jquery-iframe.js', array('jquery'), '1.0.0', true );
 	wp_enqueue_script( 'youtube-auto-play', plugin_dir_url( __FILE__ ) . 'assets/js/youtube-auto-play.js', array('jquery'), '1.0.0', true );
 }

add_action('wp_head',function(){
?>
<!-- <script src="https://f.vimeocdn.com/js/froogaloop2.min.js"></script> -->
<?php
});


 add_action( 'wp_enqueue_scripts', 'add_script_js' );
 function embed_responsive_autoplay($code){
     if(strpos($code, 'youtu.be') !== false || strpos($code, 'youtube.com') !== false){
         $return = preg_replace('@embed/([^"&]*)@', 'embed/$1&enablejsapi=1&version=3', $code);
         return '<div class="embed-container youtube">' . $return . '</div>';
     }
     if(strpos($code, 'player.vimeo.com') !== false || strpos($code, 'player.vimeo.com') !== false){
         //$return = preg_replace('@wmode=opaque([^"&]*)@', '$1&api=1&player_id=vimeoplayer', $code);
         $return = preg_replace('@video/([^"&]*)@', 'video/$1?api=1', $code);
         return '<div class="embed-container vimeo">' . $return . '</div>';
     }
     return '<div class="embed-container mp4">' . $code . '</div>';
 }

 add_filter( 'embed_oembed_html', 'embed_responsive_autoplay');
