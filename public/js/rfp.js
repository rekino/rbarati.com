const quill = new Quill('#editor', {
    modules: {
      toolbar: [
        ['bold', 'italic'],
        ['link', 'blockquote', 'code-block', 'image'],
        [{ list: 'ordered' }, { list: 'bullet' }],
      ],
    },
    theme: 'snow',
  });

document.getElementById("rfpForm").onsubmit = function() {
    document.getElementById("hiddenProposalText").value = quill.root.innerHTML;
};
