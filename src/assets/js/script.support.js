document.addEventListener('DOMContentLoaded', function() {
    console.log("Support Cargado")
    var questions = document.querySelectorAll('.faq-question');
    
    questions.forEach(function(question) {
        question.addEventListener('click', function() {
            var answer = this.nextElementSibling;
            var isVisible = answer.style.display === 'block';
            
            // Ocultar todas las respuestas
            document.querySelectorAll('.faq-answer').forEach(function(item) {
                item.style.display = 'none';
            });
            
            // Mostrar la respuesta clicada si estaba oculta
            if (!isVisible) {
                answer.style.display = 'block';
            }
        });
    });
});
